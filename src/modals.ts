import { App, Modal, TextComponent, ButtonComponent, DropdownComponent, TextAreaComponent, setIcon } from "obsidian";
import { CalendarEvent } from "./types";
import { DataService } from "./data";

export class DayDetailModal extends Modal {
  constructor(app: App, private date: string, private events: CalendarEvent[], private dataService: DataService) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("mantle-calendar-day-modal");

    const formattedDate = (window as any).moment(this.date).format("ddd DD MMM YYYY");
    contentEl.createEl("h2", { text: `Events for: ${formattedDate}` });

    const eventsList = contentEl.createDiv("events-list");

    if (this.events.length === 0) {
      eventsList.createEl("p", { text: "No events for this day.", cls: "no-events" });
    } else {
      for (const event of this.events) {
        const eventItem = eventsList.createDiv({ cls: `event-item priority-${event.priority || "none"}` });
        
        const info = eventItem.createDiv("event-info");
        info.createEl("div", { cls: "event-title", text: `Event: ${event.title}` });
        if (event.sourceType === "kanban") {
          info.createEl("div", { cls: "event-source", text: `Kanban: ${event.sourceFile}` });
        }

        const actions = eventItem.createDiv("event-actions");
        
        if (event.sourceType === "custom") {
          const editBtn = actions.createEl("button", { cls: "event-action-btn" });
          setIcon(editBtn, "pencil");
          editBtn.onclick = () => {
            this.close();
            new EventEditModal(this.app, this.dataService, event).open();
          };

          const deleteBtn = actions.createEl("button", { cls: "event-action-btn delete" });
          setIcon(deleteBtn, "trash");
          deleteBtn.onclick = async () => {
            await this.dataService.deleteCustomEvent(event.id);
            this.close();
            // Re-open with updated events
            const updatedEvents = this.dataService.getEvents().filter(e => e.date === this.date);
            new DayDetailModal(this.app, this.date, updatedEvents, this.dataService).open();
          };
        } else {
          const viewBtn = actions.createEl("button", { cls: "event-action-btn", text: "View" });
          viewBtn.onclick = () => {
            this.close();
            // Logic to open the kanban card (reused from view.ts)
            // This would be better if DataService or a shared helper handled this.
            this.app.workspace.openLinkText(event.linkedFile || event.sourceFile, event.sourceFile, false);
          };
        }
      }
    }

    const footer = contentEl.createDiv("modal-footer");
    new ButtonComponent(footer)
      .setButtonText("Add Custom Event")
      .setCta()
      .onClick(() => {
        this.close();
        new EventEditModal(this.app, this.dataService, undefined, this.date).open();
      });
  }

  onClose() {
    this.contentEl.empty();
  }
}

export class EventEditModal extends Modal {
  private event: Partial<CalendarEvent>;

  constructor(app: App, private dataService: DataService, event?: CalendarEvent, defaultDate?: string) {
    super(app);
    this.event = event ? { ...event } : {
      id: Math.random().toString(36).substring(2, 9),
      title: "",
      date: defaultDate || new Date().toISOString().split("T")[0],
      completed: false,
      priority: "none" as any
    };
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("mantle-calendar-event-modal");

    contentEl.createEl("h2", { text: this.event.id ? "Edit Event" : "Create Event" });

    const fieldContainer = contentEl.createDiv("modal-field");
    fieldContainer.createEl("label", { text: "Title" });
    new TextComponent(fieldContainer)
      .setValue(this.event.title || "")
      .setPlaceholder("Event title...")
      .onChange(val => this.event.title = val);

    const dateField = contentEl.createDiv("modal-field");
    dateField.createEl("label", { text: "Date" });
    const dateInput = dateField.createEl("input", { type: "date" });
    dateInput.value = this.event.date || "";
    dateInput.onchange = (e) => this.event.date = (e.target as HTMLInputElement).value;

    const priorityField = contentEl.createDiv("modal-field");
    priorityField.createEl("label", { text: "Priority" });
    new DropdownComponent(priorityField)
      .addOption("none", "None")
      .addOption("low", "Low")
      .addOption("medium", "Medium")
      .addOption("high", "High")
      .addOption("critical", "Critical")
      .setValue(this.event.priority || "none")
      .onChange(val => this.event.priority = val as any);

    const descField = contentEl.createDiv("modal-field");
    descField.createEl("label", { text: "Description" });
    new TextAreaComponent(descField)
      .setValue(this.event.description || "")
      .setPlaceholder("Event description...")
      .onChange(val => this.event.description = val);

    const footer = contentEl.createDiv("modal-footer");
    
    new ButtonComponent(footer)
      .setButtonText("Cancel")
      .onClick(() => this.close());

    new ButtonComponent(footer)
      .setButtonText("Save")
      .setCta()
      .onClick(async () => {
        if (!this.event.title) return;
        
        if (this.event.sourceType === "custom") {
            await this.dataService.updateCustomEvent(this.event as CalendarEvent);
        } else {
            await this.dataService.addCustomEvent(this.event as CalendarEvent);
        }
        this.close();
      });
  }

  onClose() {
    this.contentEl.empty();
  }
}
