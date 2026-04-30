import { useTranslation } from "mo-sdk";

export function Preview() {
    const { t } = useTranslation("mo-web_activity_visualization");

    const PREVIEW_TABS = [
        t("tab.keystrokes"),
        t("tab.mouseClicks"),
        t("tab.mouseMoves"),
        t("tab.mouseUps"),
        t("tab.searchs"),
        t("tab.tabs"),
    ];

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "12px",
                border: "1px dashed #aaa",
                borderRadius: "6px",
                background: "#2a2a2a",
                fontSize: "0.8rem",
                color: "#ccc",
            }}
        >
            <div style={{ fontWeight: 600, color: "#eee", marginBottom: "4px" }}>
                {t("preview.title")}
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {PREVIEW_TABS.map((label, i) => (
                    <div
                        key={label}
                        style={{
                            padding: "2px 8px",
                            background: i === 0 ? "#555" : "#333",
                            border: "1px solid #555",
                            borderRadius: "3px",
                            fontSize: "0.7rem",
                            color: i === 0 ? "#fff" : "#999",
                        }}
                    >
                        {label}
                    </div>
                ))}
            </div>
            <div style={{ color: "#777", fontSize: "0.75rem" }}>
                {t("preview.description")}
            </div>
        </div>
    );
}
