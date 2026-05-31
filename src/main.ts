import { Plugin, WorkspaceLeaf } from "obsidian";
import { CalendarView } from "./view";
import { CALENDAR_VIEW_TYPE, MantleCalendarData } from "./types";
import { DataService } from "./data";

const DEFAULT_DATA: MantleCalendarData = {
  customEvents: []
};

export default class MantleCalendar extends Plugin {
  private dataService!: DataService;
  public data!: MantleCalendarData;

  async onload() {
    console.log("Mantle Calendar: Loading plugin...");

    await this.loadSettings();

    this.dataService = new DataService(this.app, this);
    this.addChild(this.dataService);

    this.registerView(
      CALENDAR_VIEW_TYPE,
      (leaf) => new CalendarView(leaf, this.dataService)
    );

    this.addCommand({
      id: "open-calendar",
      name: "Open Calendar",
      callback: () => this.initView(),
    });

    this.app.workspace.onLayoutReady(() => {
      this.initView(false);
    });

    console.log("Mantle Calendar loaded");
  }

  async loadSettings() {
    this.data = Object.assign({}, DEFAULT_DATA, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.data);
  }

  async initView(reveal = true) {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      // getRightLeaf(false) will use an existing leaf or create one in the right sidebar
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
            type: CALENDAR_VIEW_TYPE,
            active: reveal,
        });
      }
    }

    if (leaf && reveal) {
      workspace.revealLeaf(leaf);
    }
  }
}
