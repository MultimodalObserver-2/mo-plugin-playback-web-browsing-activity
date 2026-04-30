import { PlaybackPlugin, type PluginViewProps } from "mo-sdk";
import { View } from "./components/View.js";
import { Preview } from "./components/Preview.js";


export default class WebActivityVisualizationPlugin extends PlaybackPlugin {
 
    getView(props: PluginViewProps) {
        return <View {...props} />;
    }

    getPreview() {
        return <Preview />;
    }

    validExtensions() {
        return ["json"];
    }

    validateCaptureDescriptor(descriptor: Record<string, unknown> | null): boolean {
        return descriptor?.["format"] === "web_activity_map";
    }
}
