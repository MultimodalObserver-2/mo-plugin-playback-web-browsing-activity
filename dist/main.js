import { reactExports, jsxRuntimeExports } from "react";
import { useTranslation, PlaybackPlugin } from "mo-sdk";
const useState = reactExports.useState;
const useEffect = reactExports.useEffect;
const jsx$2 = jsxRuntimeExports.jsx;
const jsxs$1 = jsxRuntimeExports.jsxs;
function toFileUrl(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (/^[a-zA-Z]:/.test(normalized)) return `file:///${normalized}`;
  return `file://${normalized}`;
}
async function loadJsonArray(path) {
  try {
    const res = await fetch(toFileUrl(path));
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
function buttonLabel(button, t) {
  if (button === 0) return t("leftMouseClickValue");
  if (button === 1) return t("centerMouseClickValue");
  if (button === 2) return t("rightMouseClickValue");
  return String(button);
}
const TAB_KEYS = ["keystrokes", "mouseClicks", "mouseMoves", "mouseUps", "searchs", "tabs"];
function EventTable({
  columns,
  rows
}) {
  return /* @__PURE__ */ jsx$2("div", {
    style: {
      overflowY: "auto",
      flex: 1,
      minHeight: 0
    },
    children: /* @__PURE__ */ jsxs$1("table", {
      style: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "0.8rem",
        fontFamily: "monospace"
      },
      children: [/* @__PURE__ */ jsx$2("thead", {
        children: /* @__PURE__ */ jsx$2("tr", {
          style: {
            background: "#2a2a2a",
            position: "sticky",
            top: 0
          },
          children: columns.map((col) => /* @__PURE__ */ jsx$2("th", {
            style: {
              padding: "6px 8px",
              textAlign: "left",
              borderBottom: "1px solid #444",
              color: "#ccc",
              fontWeight: 600,
              whiteSpace: "nowrap"
            },
            children: col.label
          }, col.value))
        })
      }), /* @__PURE__ */ jsx$2("tbody", {
        children: rows.length === 0 ? /* @__PURE__ */ jsx$2("tr", {
          children: /* @__PURE__ */ jsx$2("td", {
            colSpan: columns.length,
            style: {
              padding: "20px",
              textAlign: "center",
              color: "#777",
              fontStyle: "italic"
            },
            children: "—"
          })
        }) : rows.map((row, i) => /* @__PURE__ */ jsx$2("tr", {
          style: {
            background: i % 2 === 0 ? "#1a1a1a" : "#222"
          },
          children: row.map((cell, j) => /* @__PURE__ */ jsx$2("td", {
            style: {
              padding: "4px 8px",
              borderBottom: "1px solid #333",
              color: "#ddd",
              maxWidth: "300px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            },
            title: cell,
            children: cell
          }, j))
        }, i))
      })]
    })
  });
}
function View({
  controls,
  context
}) {
  const {
    t
  } = useTranslation("mo-web_activity_visualization");
  const [activeTab, setActiveTab] = useState("keystrokes");
  const [keystrokes, setKeystrokes] = useState([]);
  const [mouseClicks, setMouseClicks] = useState([]);
  const [mouseMoves, setMouseMoves] = useState([]);
  const [mouseUps, setMouseUps] = useState([]);
  const [searchs, setSearchs] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [seekTime, setSeekTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const mapRes = await fetch(toFileUrl(context.filePath));
        if (!mapRes.ok) throw new Error("Failed to load map file");
        const map = await mapRes.json();
        const [ks, mc, mm, mu, sr, tb] = await Promise.all([map.keystrokes ? loadJsonArray(map.keystrokes) : Promise.resolve([]), map.mouseClicks ? loadJsonArray(map.mouseClicks) : Promise.resolve([]), map.mouseMoves ? loadJsonArray(map.mouseMoves) : Promise.resolve([]), map.mouseUps ? loadJsonArray(map.mouseUps) : Promise.resolve([]), map.searchs ? loadJsonArray(map.searchs) : Promise.resolve([]), map.tabs ? loadJsonArray(map.tabs) : Promise.resolve([])]);
        if (!cancelled) {
          setKeystrokes(ks);
          setMouseClicks(mc);
          setMouseMoves(mm);
          setMouseUps(mu);
          setSearchs(sr);
          setTabs(tb);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [context.filePath]);
  useEffect(() => {
    const unsubPlay = controls.onPlay((from) => setSeekTime(from));
    const unsubPause = controls.onPause(() => {
    });
    const unsubSeek = controls.onSeek((ts) => setSeekTime(ts));
    const unsubSync = controls.onSync((ts) => setSeekTime(ts));
    return () => {
      unsubPlay();
      unsubPause();
      unsubSeek();
      unsubSync();
    };
  }, [controls]);
  function filterTs(arr) {
    if (seekTime === null) return arr;
    const absoluteLimit = context.fileCaptureStartTimestamp + seekTime / 1e3;
    return arr.filter((e) => e.captureTimestamp <= absoluteLimit);
  }
  const commonCols = [{
    label: t("col.browser"),
    value: "browser"
  }, {
    label: t("col.pageUrl"),
    value: "pageUrl"
  }, {
    label: t("col.pageTitle"),
    value: "pageTitle"
  }];
  const mousePosCols = [{
    label: t("col.xPage"),
    value: "xPage"
  }, {
    label: t("col.yPage"),
    value: "yPage"
  }, {
    label: t("col.xClient"),
    value: "xClient"
  }, {
    label: t("col.yClient"),
    value: "yClient"
  }, {
    label: t("col.xScreen"),
    value: "xScreen"
  }, {
    label: t("col.yScreen"),
    value: "yScreen"
  }];
  const tsCols = [{
    label: t("col.captureTimestamp"),
    value: "captureTimestamp"
  }];
  const tabConfig = {
    keystrokes: {
      columns: [...commonCols, {
        label: t("col.keyValue"),
        value: "keyValue"
      }, ...tsCols],
      rows: filterTs(keystrokes).map((e) => [e.browser, e.pageUrl, e.pageTitle, e.keyValue, String(e.captureTimestamp)])
    },
    mouseClicks: {
      columns: [...commonCols, ...mousePosCols, {
        label: t("col.mouseClickButton"),
        value: "button"
      }, ...tsCols],
      rows: filterTs(mouseClicks).map((e) => [e.browser, e.pageUrl, e.pageTitle, String(e.xPage), String(e.yPage), String(e.xClient), String(e.yClient), String(e.xScreen), String(e.yScreen), buttonLabel(e.button, t), String(e.captureTimestamp)])
    },
    mouseMoves: {
      columns: [...commonCols, ...mousePosCols, {
        label: t("col.xMovement"),
        value: "xMovement"
      }, {
        label: t("col.yMovement"),
        value: "yMovement"
      }, ...tsCols],
      rows: filterTs(mouseMoves).map((e) => [e.browser, e.pageUrl, e.pageTitle, String(e.xPage), String(e.yPage), String(e.xClient), String(e.yClient), String(e.xScreen), String(e.yScreen), String(e.xMovement), String(e.yMovement), String(e.captureTimestamp)])
    },
    mouseUps: {
      columns: [...commonCols, {
        label: t("col.selectedText"),
        value: "selectedText"
      }, ...tsCols],
      rows: filterTs(mouseUps).map((e) => [e.browser, e.pageUrl, e.pageTitle, e.selectedText, String(e.captureTimestamp)])
    },
    searchs: {
      columns: [...commonCols, {
        label: t("col.search"),
        value: "search"
      }, ...tsCols],
      rows: filterTs(searchs).map((e) => [e.browser, e.pageUrl, e.pageTitle, e.search, String(e.captureTimestamp)])
    },
    tabs: {
      columns: [{
        label: t("col.browser"),
        value: "browser"
      }, {
        label: t("col.tabUrl"),
        value: "tabUrl"
      }, {
        label: t("col.tabTitle"),
        value: "tabTitle"
      }, {
        label: t("col.actionType"),
        value: "actionType"
      }, {
        label: t("col.tabIndex"),
        value: "tabIndex"
      }, {
        label: t("col.tabId"),
        value: "tabId"
      }, {
        label: t("col.windowId"),
        value: "windowId"
      }, ...tsCols],
      rows: filterTs(tabs).map((e) => [e.browser, e.tabUrl, e.tabTitle, e.actionType, String(e.tabIndex), String(e.tabId), String(e.windowId), String(e.captureTimestamp)])
    }
  };
  const tabLabels = {
    keystrokes: t("tab.keystrokes"),
    mouseClicks: t("tab.mouseClicks"),
    mouseMoves: t("tab.mouseMoves"),
    mouseUps: t("tab.mouseUps"),
    searchs: t("tab.searchs"),
    tabs: t("tab.tabs")
  };
  if (loading) {
    return /* @__PURE__ */ jsx$2("div", {
      style: containerStyle,
      children: /* @__PURE__ */ jsx$2("div", {
        style: messageStyle,
        children: t("loading")
      })
    });
  }
  if (error) {
    return /* @__PURE__ */ jsx$2("div", {
      style: containerStyle,
      children: /* @__PURE__ */ jsx$2("div", {
        style: {
          ...messageStyle,
          color: "#f88"
        },
        children: error
      })
    });
  }
  const {
    columns,
    rows
  } = tabConfig[activeTab];
  return /* @__PURE__ */ jsxs$1("div", {
    style: containerStyle,
    children: [/* @__PURE__ */ jsx$2("div", {
      style: tabBarStyle,
      children: TAB_KEYS.map((key) => /* @__PURE__ */ jsx$2("button", {
        onClick: () => setActiveTab(key),
        style: {
          ...tabBtnStyle,
          ...activeTab === key ? tabBtnActiveStyle : {}
        },
        children: tabLabels[key]
      }, key))
    }), /* @__PURE__ */ jsx$2(EventTable, {
      columns,
      rows
    })]
  });
}
const containerStyle = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "#1a1a1a",
  color: "#ddd",
  fontFamily: "sans-serif",
  overflow: "hidden"
};
const messageStyle = {
  padding: "20px",
  textAlign: "center",
  fontSize: "0.9rem",
  color: "#999"
};
const tabBarStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "2px",
  padding: "8px 8px 0",
  background: "#2a2a2a",
  borderBottom: "2px solid #444"
};
const tabBtnStyle = {
  padding: "6px 14px",
  border: "1px solid #444",
  borderBottom: "none",
  background: "#333",
  color: "#aaa",
  cursor: "pointer",
  borderRadius: "4px 4px 0 0",
  fontSize: "0.8rem",
  fontFamily: "sans-serif"
};
const tabBtnActiveStyle = {
  background: "#1a1a1a",
  color: "#eee",
  borderColor: "#666"
};
const jsx$1 = jsxRuntimeExports.jsx;
const jsxs = jsxRuntimeExports.jsxs;
function Preview() {
  const {
    t
  } = useTranslation("mo-web_activity_visualization");
  const PREVIEW_TABS = [t("tab.keystrokes"), t("tab.mouseClicks"), t("tab.mouseMoves"), t("tab.mouseUps"), t("tab.searchs"), t("tab.tabs")];
  return /* @__PURE__ */ jsxs("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      padding: "12px",
      border: "1px dashed #aaa",
      borderRadius: "6px",
      background: "#2a2a2a",
      fontSize: "0.8rem",
      color: "#ccc"
    },
    children: [/* @__PURE__ */ jsx$1("div", {
      style: {
        fontWeight: 600,
        color: "#eee",
        marginBottom: "4px"
      },
      children: t("preview.title")
    }), /* @__PURE__ */ jsx$1("div", {
      style: {
        display: "flex",
        gap: "4px",
        flexWrap: "wrap"
      },
      children: PREVIEW_TABS.map((label, i) => /* @__PURE__ */ jsx$1("div", {
        style: {
          padding: "2px 8px",
          background: i === 0 ? "#555" : "#333",
          border: "1px solid #555",
          borderRadius: "3px",
          fontSize: "0.7rem",
          color: i === 0 ? "#fff" : "#999"
        },
        children: label
      }, label))
    }), /* @__PURE__ */ jsx$1("div", {
      style: {
        color: "#777",
        fontSize: "0.75rem"
      },
      children: t("preview.description")
    })]
  });
}
const jsx = jsxRuntimeExports.jsx;
class WebActivityVisualizationPlugin extends PlaybackPlugin {
  getView(props) {
    return /* @__PURE__ */ jsx(View, {
      ...props
    });
  }
  getPreview() {
    return /* @__PURE__ */ jsx(Preview, {});
  }
  validExtensions() {
    return ["json"];
  }
  validateCaptureDescriptor(descriptor) {
    return descriptor?.["format"] === "web_activity_map";
  }
}
export {
  WebActivityVisualizationPlugin as default
};
