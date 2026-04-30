import { useState, useEffect } from "react"
import { useTranslation, type PluginViewProps as PlaybackViewProps } from "mo-sdk"


interface Keystroke {
  browser: string
  pageUrl: string
  pageTitle: string
  keyValue: string
  captureTimestamp: number
}

interface MouseClick {
  browser: string
  pageUrl: string
  pageTitle: string
  xPage: number
  yPage: number
  xClient: number
  yClient: number
  xScreen: number
  yScreen: number
  button: number
  captureTimestamp: number
}

interface MouseMove {
  browser: string
  pageUrl: string
  pageTitle: string
  xPage: number
  yPage: number
  xClient: number
  yClient: number
  xScreen: number
  yScreen: number
  xMovement: number
  yMovement: number
  captureTimestamp: number
}

interface MouseUp {
  browser: string
  pageUrl: string
  pageTitle: string
  selectedText: string
  captureTimestamp: number
}

interface SearchAction {
  browser: string
  pageUrl: string
  pageTitle: string
  search: string
  captureTimestamp: number
}

interface TabAction {
  browser: string
  tabUrl: string
  tabTitle: string
  actionType: string
  tabIndex: number
  tabId: number
  windowId: number
  captureTimestamp: number
}

interface WebActivityMap {
  keystrokes?: string
  mouseClicks?: string
  mouseMoves?: string
  mouseUps?: string
  searchs?: string
  tabs?: string
}


function toFileUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/")
  if (/^[a-zA-Z]:/.test(normalized))
    return `file:///${normalized}`
  return `file://${normalized}`
}

async function loadJsonArray<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(toFileUrl(path))
    if (!res.ok)
      return []
    return (await res.json()) as T[]
  } catch {
    return []
  }
}

function buttonLabel(button: number, t: (key: string) => string): string {
  if (button === 0)
    return t("leftMouseClickValue")
  if (button === 1)
    return t("centerMouseClickValue")
  if (button === 2)
    return t("rightMouseClickValue")
  return String(button)
}

const TAB_KEYS = [
  "keystrokes",
  "mouseClicks",
  "mouseMoves",
  "mouseUps",
  "searchs",
  "tabs",
] as const
type TabKey = (typeof TAB_KEYS)[number]

interface Column {
  label: string
  value: string
}

function EventTable({ columns, rows }: { columns: Column[]; rows: string[][] }) {
  return (
    <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.8rem",
          fontFamily: "monospace",
        }}
      >
        <thead>
          <tr style={{ background: "#2a2a2a", position: "sticky", top: 0 }}>
            {columns.map((col) => (
              <th
                key={col.value}
                style={{
                  padding: "6px 8px",
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  color: "#ccc",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#777",
                  fontStyle: "italic",
                }}
              >
                —
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                style={{ background: i % 2 === 0 ? "#1a1a1a" : "#222" }}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    style={{
                      padding: "4px 8px",
                      borderBottom: "1px solid #333",
                      color: "#ddd",
                      maxWidth: "300px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={cell}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}


export function View({ controls, context }: PlaybackViewProps) {
  const { t } = useTranslation("mo-web_activity_visualization")

  const [activeTab, setActiveTab] = useState<TabKey>("keystrokes")
  const [keystrokes, setKeystrokes] = useState<Keystroke[]>([])
  const [mouseClicks, setMouseClicks] = useState<MouseClick[]>([])
  const [mouseMoves, setMouseMoves] = useState<MouseMove[]>([])
  const [mouseUps, setMouseUps] = useState<MouseUp[]>([])
  const [searchs, setSearchs] = useState<SearchAction[]>([])
  const [tabs, setTabs] = useState<TabAction[]>([])
  const [seekTime, setSeekTime] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const mapRes = await fetch(toFileUrl(context.filePath))
        if (!mapRes.ok) throw new Error("Failed to load map file")
        const map = (await mapRes.json()) as WebActivityMap

        const [ks, mc, mm, mu, sr, tb] = await Promise.all([
          map.keystrokes ? loadJsonArray<Keystroke>(map.keystrokes) : Promise.resolve([]),
          map.mouseClicks ? loadJsonArray<MouseClick>(map.mouseClicks) : Promise.resolve([]),
          map.mouseMoves ? loadJsonArray<MouseMove>(map.mouseMoves) : Promise.resolve([]),
          map.mouseUps ? loadJsonArray<MouseUp>(map.mouseUps) : Promise.resolve([]),
          map.searchs ? loadJsonArray<SearchAction>(map.searchs) : Promise.resolve([]),
          map.tabs ? loadJsonArray<TabAction>(map.tabs) : Promise.resolve([]),
        ])

        if (!cancelled) {
          setKeystrokes(ks)
          setMouseClicks(mc)
          setMouseMoves(mm)
          setMouseUps(mu)
          setSearchs(sr)
          setTabs(tb)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load data"
          )
        }
      } finally {
        if (!cancelled)
          setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [context.filePath])

  useEffect(() => {
    const unsub = [
      controls.onPlay((from: number) => setSeekTime(from)),
      controls.onPause(() => {}),
      controls.onSeek((ts: number) => setSeekTime(ts)),
      controls.onSync((ts: number) => setSeekTime(ts)),
    ]
    return () => unsub.forEach((fn) => fn())
  }, [controls])

  function filterTs<T extends { captureTimestamp: number }>(arr: T[]): T[] {
    if (seekTime === null)
      return arr
    const absoluteLimit = context.fileCaptureStartTimestamp + seekTime / 1000
    return arr.filter((e) => e.captureTimestamp <= absoluteLimit)
  }

  const commonCols: Column[] = [
    { label: t("col.browser"), value: "browser" },
    { label: t("col.pageUrl"), value: "pageUrl" },
    { label: t("col.pageTitle"), value: "pageTitle" },
  ]

  const mousePosCols: Column[] = [
    { label: t("col.xPage"), value: "xPage" },
    { label: t("col.yPage"), value: "yPage" },
    { label: t("col.xClient"), value: "xClient" },
    { label: t("col.yClient"), value: "yClient" },
    { label: t("col.xScreen"), value: "xScreen" },
    { label: t("col.yScreen"), value: "yScreen" },
  ]

  const tsCols: Column[] = [
    { label: t("col.captureTimestamp"), value: "captureTimestamp" },
  ]

  const tabConfig: Record<TabKey, { columns: Column[]; rows: string[][] }> = {
    keystrokes: {
      columns: [
        ...commonCols,
        { label: t("col.keyValue"), value: "keyValue" },
        ...tsCols,
      ],
      rows: filterTs(keystrokes).map((e) => [
        e.browser, e.pageUrl, e.pageTitle,
        e.keyValue, String(e.captureTimestamp),
      ]),
    },
    mouseClicks: {
      columns: [
        ...commonCols,
        ...mousePosCols,
        { label: t("col.mouseClickButton"), value: "button" },
        ...tsCols,
      ],
      rows: filterTs(mouseClicks).map((e) => [
        e.browser, e.pageUrl, e.pageTitle,
        String(e.xPage), String(e.yPage),
        String(e.xClient), String(e.yClient),
        String(e.xScreen), String(e.yScreen),
        buttonLabel(e.button, t),
        String(e.captureTimestamp),
      ]),
    },
    mouseMoves: {
      columns: [
        ...commonCols,
        ...mousePosCols,
        { label: t("col.xMovement"), value: "xMovement" },
        { label: t("col.yMovement"), value: "yMovement" },
        ...tsCols,
      ],
      rows: filterTs(mouseMoves).map((e) => [
        e.browser, e.pageUrl, e.pageTitle,
        String(e.xPage), String(e.yPage),
        String(e.xClient), String(e.yClient),
        String(e.xScreen), String(e.yScreen),
        String(e.xMovement), String(e.yMovement),
        String(e.captureTimestamp),
      ]),
    },
    mouseUps: {
      columns: [
        ...commonCols,
        { label: t("col.selectedText"), value: "selectedText" },
        ...tsCols,
      ],
      rows: filterTs(mouseUps).map((e) => [
        e.browser, e.pageUrl, e.pageTitle,
        e.selectedText, String(e.captureTimestamp),
      ]),
    },
    searchs: {
      columns: [
        ...commonCols,
        { label: t("col.search"), value: "search" },
        ...tsCols,
      ],
      rows: filterTs(searchs).map((e) => [
        e.browser, e.pageUrl, e.pageTitle,
        e.search, String(e.captureTimestamp),
      ]),
    },
    tabs: {
      columns: [
        { label: t("col.browser"), value: "browser" },
        { label: t("col.tabUrl"), value: "tabUrl" },
        { label: t("col.tabTitle"), value: "tabTitle" },
        { label: t("col.actionType"), value: "actionType" },
        { label: t("col.tabIndex"), value: "tabIndex" },
        { label: t("col.tabId"), value: "tabId" },
        { label: t("col.windowId"), value: "windowId" },
        ...tsCols,
      ],
      rows: filterTs(tabs).map((e) => [
        e.browser, e.tabUrl, e.tabTitle,
        e.actionType,
        String(e.tabIndex), String(e.tabId), String(e.windowId),
        String(e.captureTimestamp),
      ]),
    },
  }

  const tabLabels: Record<TabKey, string> = {
    keystrokes: t("tab.keystrokes"),
    mouseClicks: t("tab.mouseClicks"),
    mouseMoves: t("tab.mouseMoves"),
    mouseUps: t("tab.mouseUps"),
    searchs: t("tab.searchs"),
    tabs: t("tab.tabs"),
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={messageStyle}>{t("loading")}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ ...messageStyle, color: "#f88" }}>{error}</div>
      </div>
    )
  }

  const { columns, rows } = tabConfig[activeTab]

  return (
    <div style={containerStyle}>
      <div style={tabBarStyle}>
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              ...tabBtnStyle,
              ...(activeTab === key ? tabBtnActiveStyle : {}),
            }}
          >
            {tabLabels[key]}
          </button>
        ))}
      </div>

      <EventTable columns={columns} rows={rows} />
    </div>
  )
}


const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "#1a1a1a",
  color: "#ddd",
  fontFamily: "sans-serif",
  overflow: "hidden",
}

const messageStyle: React.CSSProperties = {
  padding: "20px",
  textAlign: "center",
  fontSize: "0.9rem",
  color: "#999",
}

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "2px",
  padding: "8px 8px 0",
  background: "#2a2a2a",
  borderBottom: "2px solid #444",
}

const tabBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  border: "1px solid #444",
  borderBottom: "none",
  background: "#333",
  color: "#aaa",
  cursor: "pointer",
  borderRadius: "4px 4px 0 0",
  fontSize: "0.8rem",
  fontFamily: "sans-serif",
}

const tabBtnActiveStyle: React.CSSProperties = {
  background: "#1a1a1a",
  color: "#eee",
  borderColor: "#666",
}
