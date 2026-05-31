import { ItemView, WorkspaceLeaf, setIcon, moment, MarkdownView, Menu } from "obsidian";
import { CALENDAR_VIEW_TYPE, CalendarEvent } from "./types";
import { DataService } from "./data";
import { DayDetailModal, EventEditModal } from "./modals";

export class CalendarView extends ItemView {
  private dataService: DataService;
  private currentMonth: moment.Moment;
  private currentView: "month" | "schedule" = "month";

  constructor(leaf: WorkspaceLeaf, dataService: DataService) {
    super(leaf);
    this.dataService = dataService;
    this.currentMonth = (window as any).moment().startOf("month");
  }

  getViewType(): string {
    return CALENDAR_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Mantle Calendar";
  }

  getIcon(): string {
    return "calendar-days";
  }

  async onOpen() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("mantle-calendar-container");

    this.dataService.onUpdate(() => {
      this.render();
    });

    this.render();
  }

  render() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();

    const header = container.createEl("div", { cls: "calendar-header" });
    
    // Row 1: Title + Nav Buttons
    const dateRow = header.createEl("div", { cls: "calendar-date-row" });

    // Left-aligned title
    dateRow.createEl("div", { 
      cls: "calendar-title", 
      text: this.currentMonth.format("MMMM YYYY") 
    });

    // Navigation controls group
    const navControls = dateRow.createEl("div", { cls: "calendar-nav-controls" });
    
    const prevBtn = navControls.createEl("button", { cls: "calendar-nav-btn" });
    setIcon(prevBtn, "chevron-left");
    prevBtn.onClickEvent(() => {
      this.currentMonth.subtract(1, "month");
      this.render();
    });

    const nextBtn = navControls.createEl("button", { cls: "calendar-nav-btn" });
    setIcon(nextBtn, "chevron-right");
    nextBtn.onClickEvent(() => {
      this.currentMonth.add(1, "month");
      this.render();
    });

    const todayBtn = navControls.createEl("button", { cls: "calendar-today-btn", text: "Today" });
    todayBtn.onClickEvent(() => {
      this.currentMonth = (window as any).moment().startOf("month");
      this.render();
    });

    const addEventBtn = navControls.createEl("button", { 
      cls: "calendar-nav-btn", 
      attr: { "aria-label": "Add Event" } 
    });
    setIcon(addEventBtn, "plus");
    addEventBtn.onClickEvent(() => {
      const todayStr = (window as any).moment().format("YYYY-MM-DD");
      new EventEditModal(this.app, this.dataService, undefined, todayStr).open();
    });

    // Row 2: View Switcher
    const viewRow = header.createEl("div", { cls: "calendar-view-row" });
    const viewSwitcher = viewRow.createEl("div", { cls: "calendar-view-switcher" });
    
    const monthBtn = viewSwitcher.createEl("button", { 
      cls: `calendar-view-btn${this.currentView === "month" ? " is-active" : ""}`, 
      text: "Month" 
    });
    monthBtn.onClickEvent(() => {
      this.currentView = "month";
      this.render();
    });

    const scheduleBtn = viewSwitcher.createEl("button", { 
      cls: `calendar-view-btn${this.currentView === "schedule" ? " is-active" : ""}`, 
      text: "Schedule" 
    });
    scheduleBtn.onClickEvent(() => {
      this.currentView = "schedule";
      this.render();
    });

    if (this.currentView === "month") {
      this.renderMonthView(container);
    } else {
      this.renderScheduleView(container);
    }
  }

  private renderMonthView(container: HTMLElement) {
    const grid = container.createEl("div", { cls: "calendar-grid" });

    // Days of week header
    const weekdays = moment.weekdaysMin(true);
    for (const day of weekdays) {
      grid.createEl("div", { cls: "calendar-weekday", text: day });
    }

    const startOfMonth = this.currentMonth.clone().startOf("month");
    const endOfMonth = this.currentMonth.clone().endOf("month");
    const startOfGrid = startOfMonth.clone().startOf("week");
    const endOfGrid = endOfMonth.clone().endOf("week");

    const events = this.dataService.getEvents();
    const today = (window as any).moment().format("YYYY-MM-DD");

    let day = startOfGrid.clone();
    while (day.isBefore(endOfGrid, "day") || day.isSame(endOfGrid, "day")) {
      const dayEl = grid.createEl("div", { cls: "calendar-day" });
      const currentDay = day.format("YYYY-MM-DD");
      
      if (day.month() !== this.currentMonth.month()) {
        dayEl.addClass("other-month");
      }

      if (currentDay === today) {
        dayEl.addClass("is-today");
      }

      dayEl.createEl("div", { cls: "day-number", text: day.date().toString() });

      const dayEvents = events.filter(e => e.date === currentDay);
      
      dayEl.onclick = (ev) => {
        const menu = new Menu();
        
        menu.addItem((item) => {
            item
                .setTitle("Add Custom Event")
                .setIcon("plus")
                .onClick(() => {
                    new EventEditModal(this.app, this.dataService, undefined, currentDay).open();
                });
        });

        if (dayEvents.length > 0) {
            menu.addSeparator();
            for (const event of dayEvents) {
                menu.addItem((item) => {
                    const truncatedTitle = event.title.length > 30 ? event.title.substring(0, 30) + "..." : event.title;
                    item
                        .setTitle(`Event: ${truncatedTitle}`)
                        .setIcon(event.sourceType === "kanban" ? "square-kanban" : "calendar-plus")
                        .onClick(async () => {
                            if (event.sourceType === "kanban") {
                                await this.openKanbanCard(event);
                            } else {
                                new EventEditModal(this.app, this.dataService, event).open();
                            }
                        });
                });
            }
            
            menu.addSeparator();
            menu.addItem((item) => {
                item
                    .setTitle("Show Day Details")
                    .setIcon("list")
                    .onClick(() => {
                        new DayDetailModal(this.app, currentDay, dayEvents, this.dataService).open();
                    });
            });
        }

        menu.showAtMouseEvent(ev);
      };

      if (dayEvents.length > 0) {
        const eventsContainer = dayEl.createEl("div", { cls: "day-events" });
        for (const event of dayEvents) {
          const eventEl = eventsContainer.createEl("div", { 
            cls: `calendar-event priority-${event.priority || "none"}`,
            text: event.title,
            attr: { "aria-label": event.title }
          });
          
          if (event.completed) {
            eventEl.addClass("is-completed");
          }

          eventEl.onClickEvent(async (ev) => {
            ev.stopPropagation();
            if (event.sourceType === "kanban") {
              await this.openKanbanCard(event);
            } else {
              new EventEditModal(this.app, this.dataService, event).open();
            }
          });
        }
      }

      day.add(1, "day");
    }
  }

  private renderScheduleView(container: HTMLElement) {
    const scheduleContainer = container.createEl("div", { cls: "calendar-schedule" });

    const events = this.dataService.getEvents();
    const today = (window as any).moment().format("YYYY-MM-DD");

    // Filter to selected month
    const monthEvents = events.filter(e => {
      const date = (window as any).moment(e.date);
      return date.isSame(this.currentMonth, "month");
    });

    // Sort chronologically
    monthEvents.sort((a, b) => a.date.localeCompare(b.date));

    // Group by date
    const grouped = new Map<string, CalendarEvent[]>();
    for (const event of monthEvents) {
      if (!grouped.has(event.date)) {
        grouped.set(event.date, []);
      }
      grouped.get(event.date)!.push(event);
    }

    if (grouped.size === 0) {
      const emptyState = scheduleContainer.createEl("div", { cls: "schedule-empty-state" });
      const emptyIcon = emptyState.createEl("div", { cls: "schedule-empty-icon" });
      setIcon(emptyIcon, "calendar-days");
      
      emptyState.createEl("p", { text: "No events scheduled for this month." });
      
      const addBtn = emptyState.createEl("button", { 
        cls: "calendar-today-btn", 
        text: "Add Custom Event" 
      });
      addBtn.onClickEvent(() => {
        new EventEditModal(this.app, this.dataService, undefined, this.currentMonth.clone().startOf("month").format("YYYY-MM-DD")).open();
      });
      return;
    }

    for (const [dateStr, dayEvents] of grouped) {
      const dayMoment = (window as any).moment(dateStr);
      const isToday = dateStr === today;

      const row = scheduleContainer.createEl("div", { cls: "schedule-day-row" });
      const dayInfo = row.createEl("div", { cls: "schedule-day-info" });
      
      dayInfo.createEl("div", { 
        cls: "schedule-weekday", 
        text: dayMoment.format("ddd") 
      });

      dayInfo.createEl("div", { 
        cls: `schedule-day-number${isToday ? " is-today" : ""}`, 
        text: dayMoment.date().toString() 
      });


      const eventsContainer = row.createEl("div", { cls: "schedule-day-events" });
      for (const event of dayEvents) {
        const card = eventsContainer.createEl("div", { 
          cls: `schedule-event-card priority-${event.priority || "none"}` 
        });
        if (event.completed) {
          card.addClass("is-completed");
        }

        const title = card.createEl("div", { 
          cls: "schedule-event-title", 
          text: event.title 
        });

        const meta = card.createEl("div", { cls: "schedule-event-meta" });
        
        const sourceSpan = meta.createEl("span", { cls: "schedule-event-source" });
        if (event.sourceType === "kanban") {
          setIcon(sourceSpan, "square-kanban");
          sourceSpan.createEl("span", { text: "Kanban" });
        } else {
          setIcon(sourceSpan, "calendar-plus");
          sourceSpan.createEl("span", { text: "Custom" });
        }

        if (event.priority) {
          const prioritySpan = meta.createEl("span", { 
            cls: `schedule-event-priority priority-${event.priority}`,
            text: event.priority 
          });
        }

        card.onClickEvent(async (ev) => {
          ev.stopPropagation();
          if (event.sourceType === "kanban") {
            await this.openKanbanCard(event);
          } else {
            new EventEditModal(this.app, this.dataService, event).open();
          }
        });
      }
    }
  }

  private async openKanbanCard(event: CalendarEvent) {
    const target = event.linkedFile || event.sourceFile;
    const sourcePath = event.sourceFile;

    // Resolve the file
    const file = this.app.metadataCache.getFirstLinkpathDest(target, sourcePath);
    
    if (file) {
      const cache = this.app.metadataCache.getFileCache(file);
      const isKanban = cache?.frontmatter?.["kanban-plugin"] === "basic";

      if (isKanban) {
        let leaf: WorkspaceLeaf | null = null;
        // Look for existing kanban leaf
        this.app.workspace.iterateAllLeaves((l) => {
          if (l.view.getViewType() === "mantle-kanban-view" && (l.view as any).file?.path === file.path) {
            leaf = l;
          }
        });

        if (leaf) {
          this.app.workspace.setActiveLeaf(leaf, { focus: true });
        } else {
          // Open in current tab and switch to kanban view
          const newLeaf = this.app.workspace.getLeaf(false);
          await newLeaf.setViewState({
            type: "mantle-kanban-view",
            active: true,
            state: { file: file.path }
          });
        }
      } else {
        // Standard file opening logic
        let existingLeaf: WorkspaceLeaf | null = null;
        this.app.workspace.iterateAllLeaves((leaf) => {
          if (leaf.view instanceof MarkdownView && leaf.view.file?.path === file.path) {
            existingLeaf = leaf;
          }
        });

        if (existingLeaf) {
          this.app.workspace.setActiveLeaf(existingLeaf, { focus: true });
        } else {
          const leaf = this.app.workspace.getLeaf(false);
          await leaf.openFile(file);
        }
      }
    } else {
      this.app.workspace.openLinkText(target, sourcePath, false);
    }
  }
}
