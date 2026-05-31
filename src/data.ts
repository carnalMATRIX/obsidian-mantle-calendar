import { App, TFile, Component } from "obsidian";
import { CalendarEvent } from "./types";
import { parseMarkdown } from "../../mantle-kanban/src/parser";
import MantleCalendar from "./main";

export class DataService extends Component {
  private kanbanEvents: CalendarEvent[] = [];
  private onUpdateCallbacks: (() => void)[] = [];

  constructor(private app: App, private plugin: MantleCalendar) {
    super();
  }

  onload() {
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (this.isKanbanFile(file)) {
          this.refreshKanbanEvents();
        }
      })
    );

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.refreshKanbanEvents();
        }
      })
    );

    this.registerEvent(
      this.app.metadataCache.on("resolved", () => {
        this.refreshKanbanEvents();
      })
    );

    this.refreshKanbanEvents();
  }

  onUpdate(callback: (() => void)) {
    this.onUpdateCallbacks.push(callback);
  }

  private triggerUpdate() {
    for (const callback of this.onUpdateCallbacks) {
      callback();
    }
  }

  async refreshKanbanEvents() {
    const newEvents: CalendarEvent[] = [];
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      if (this.isKanbanFile(file)) {
        const content = await this.app.vault.read(file);
        const data = parseMarkdown(content);
        
        for (const column of data.columns) {
          for (const card of column.cards) {
            if (card.deadline) {
              newEvents.push({
                id: card.id,
                title: card.title,
                date: card.deadline,
                sourceFile: file.path,
                sourceType: "kanban",
                completed: card.completed,
                priority: card.priority,
                linkedFile: card.linkedFile
              });
            }
          }
        }
      }
    }

    this.kanbanEvents = newEvents;
    this.triggerUpdate();
  }

  getEvents(): CalendarEvent[] {
    return [...this.kanbanEvents, ...this.plugin.data.customEvents];
  }

  async addCustomEvent(event: Omit<CalendarEvent, "sourceType" | "sourceFile">) {
    const fullEvent: CalendarEvent = {
      ...event,
      sourceType: "custom",
      sourceFile: ""
    };
    this.plugin.data.customEvents.push(fullEvent);
    await this.plugin.saveSettings();
    this.triggerUpdate();
  }

  async deleteCustomEvent(id: string) {
    this.plugin.data.customEvents = this.plugin.data.customEvents.filter(e => e.id !== id);
    await this.plugin.saveSettings();
    this.triggerUpdate();
  }

  async updateCustomEvent(event: CalendarEvent) {
    const index = this.plugin.data.customEvents.findIndex(e => e.id === event.id);
    if (index !== -1) {
      this.plugin.data.customEvents[index] = event;
      await this.plugin.saveSettings();
      this.triggerUpdate();
    }
  }

  private isKanbanFile(file: TFile): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.["kanban-plugin"] === "basic";
  }
}
