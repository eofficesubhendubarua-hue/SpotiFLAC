import { X, Minus, Maximize, SlidersHorizontal, Globe, Eye, EyeOff, Check } from "lucide-react";
import { WindowMinimise, WindowToggleMaximise, Quit } from "../../wailsjs/runtime/runtime";
import { Menubar, MenubarContent, MenubarMenu, MenubarItem, MenubarTrigger, MenubarLabel, MenubarSeparator } from "@/components/ui/menubar";
import { Slider } from "@/components/ui/slider";
import { getSettings, updateSettings } from "@/lib/settings";
import type { Settings } from "@/lib/settings";
import { PREVIEW_VOLUME_CHANGED_EVENT } from "@/lib/preview";
import { fetchCurrentIPInfo } from "@/lib/api";
import type { CurrentIPInfo } from "@/types/api";
import { openExternal } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
const IP_INFO_REFRESH_INTERVAL_MS = 30000;
const SPOTIFY_BLOCKED_COUNTRY_CODES = new Set([
    "AF",
    "IO",
    "CF",
    "CN",
    "CU",
    "ER",
    "IR",
    "MM",
    "KP",
    "RU",
    "SO",
    "SS",
    "SD",
    "SY",
    "TM",
    "YE",
]);
interface SettingsUpdatedDetail {
    previewVolume?: number;
}
type DownloaderSource = Settings["downloader"];
const SOURCE_OPTIONS: { value: DownloaderSource; label: string; color: string }[] = [
    { value: "auto",   label: "Auto",          color: "text-muted-foreground" },
    { value: "tidal",  label: "Tidal",         color: "text-blue-400" },
    { value: "qobuz",  label: "Qobuz",         color: "text-violet-400" },
    { value: "amazon", label: "Amazon Music",  color: "text-cyan-400" },
];
export function TitleBar() {
    const initialSettings = getSettings();
    const [previewVolume, setPreviewVolume] = useState(initialSettings.previewVolume ?? 100);
    const [downloaderSource, setDownloaderSource] = useState<DownloaderSource>(initialSettings.downloader ?? "auto");
    const [currentIPInfo, setCurrentIPInfo] = useState<CurrentIPInfo | null>(null);
    const [isLoadingCurrentIPInfo, setIsLoadingCurrentIPInfo] = useState(false);
    const [currentIPInfoError, setCurrentIPInfoError] = useState("");
    const [showIPAddress, setShowIPAddress] = useState(false);
    const currentIPInfoRef = useRef<CurrentIPInfo | null>(null);
    useEffect(() => {
        currentIPInfoRef.current = currentIPInfo;
    }, [currentIPInfo]);
    useEffect(() => {
        const handleSettingsUpdate = (event: Event) => {
            const updatedSettings = (event as CustomEvent<SettingsUpdatedDetail>).detail;
            if (updatedSettings && typeof updatedSettings.previewVolume === "number") {
                setPreviewVolume(updatedSettings.previewVolume);
            }
            if (updatedSettings && typeof (updatedSettings as any).downloader === "string") {
                setDownloaderSource((updatedSettings as any).downloader as DownloaderSource);
            }
        };
        window.addEventListener("settingsUpdated", handleSettingsUpdate);
        return () => window.removeEventListener("settingsUpdated", handleSettingsUpdate);
    }, []);
    const handleSourceChange = async (source: DownloaderSource) => {
        setDownloaderSource(source);
        await updateSettings({ downloader: source });
        window.dispatchEvent(new CustomEvent("settingsUpdated", { detail: { downloader: source } }));
    };
    const loadCurrentIPInfo = async (options?: {
        silent?: boolean;
    }) => {
        const silent = options?.silent ?? false;
        if (!silent) {
            setIsLoadingCurrentIPInfo(true);
            setCurrentIPInfoError("");
        }
        try {
            const info = await fetchCurrentIPInfo();
            setCurrentIPInfo(info);
            setCurrentIPInfoError("");
        }
        catch (error) {
            if (!silent || !currentIPInfoRef.current) {
                setCurrentIPInfo(null);
                setCurrentIPInfoError(error instanceof Error ? error.message : "Unable to detect IP");
            }
        }
        finally {
            if (!silent) {
                setIsLoadingCurrentIPInfo(false);
            }
        }
    };
    useEffect(() => {
        void loadCurrentIPInfo();
    }, []);
    useEffect(() => {
        const intervalId = window.setInterval(() => {
            void loadCurrentIPInfo({ silent: true });
        }, IP_INFO_REFRESH_INTERVAL_MS);
        const handleFocus = () => {
            if (document.visibilityState === "hidden") {
                return;
            }
            void loadCurrentIPInfo({ silent: true });
        };
        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleFocus);
        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleFocus);
        };
    }, []);
    const handleMinimize = () => {
        WindowMinimise();
    };
    const handleMaximize = () => {
        WindowToggleMaximise();
    };
    const handleClose = () => {
        Quit();
    };
    const handlePreviewVolumeChange = (value: number[]) => {
        const nextValue = value[0];
        if (typeof nextValue !== "number" || Number.isNaN(nextValue)) {
            return;
        }
        setPreviewVolume(nextValue);
        window.dispatchEvent(new CustomEvent(PREVIEW_VOLUME_CHANGED_EVENT, { detail: nextValue }));
    };
    const handlePreviewVolumeCommit = (value: number[]) => {
        const nextValue = value[0];
        if (typeof nextValue !== "number" || Number.isNaN(nextValue)) {
            return;
        }
        setPreviewVolume(nextValue);
        void updateSettings({ previewVolume: nextValue });
    };
    const detectedCountryCode = currentIPInfo?.country_code?.toUpperCase() || "";
    const detectedFlagPath = detectedCountryCode ? `/assets/flags/${detectedCountryCode.toLowerCase()}.svg` : "";
    const isSpotifyBlockedCountry = detectedCountryCode !== "" && SPOTIFY_BLOCKED_COUNTRY_CODES.has(detectedCountryCode);
    return (<>

      <div className="fixed top-0 left-14 right-0 h-10 z-40 bg-background/80 backdrop-blur-sm" style={{ "--wails-draggable": "drag" } as React.CSSProperties} onDoubleClick={handleMaximize}/>


      <div className="fixed top-1.5 right-2 z-50 flex h-7 gap-0.5 items-center">
        <Menubar className="border-none bg-transparent shadow-none px-0 mr-1" style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}>
            <MenubarMenu>
                <MenubarTrigger className="cursor-pointer w-8 h-7 p-0 flex items-center justify-center hover:bg-muted transition-colors rounded data-[state=open]:bg-muted">
                    <SlidersHorizontal className="w-3.5 h-3.5"/>
                </MenubarTrigger>
                <MenubarContent align="end" className="min-w-70">
                    <div className="px-2 py-1.5 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <MenubarLabel className="p-0">Preview Volume</MenubarLabel>
                            <span className="text-xs font-medium text-muted-foreground tabular-nums">
                                {previewVolume}%
                            </span>
                        </div>
                        <Slider value={[previewVolume]} min={0} max={100} step={5} onValueChange={handlePreviewVolumeChange} onValueCommit={handlePreviewVolumeCommit} aria-label="Preview volume"/>
                    </div>
                    <MenubarSeparator />
                    <div className="flex items-center gap-1.5 px-2 py-1.5">
                        <MenubarLabel className="p-0">Network</MenubarLabel>
                        {isSpotifyBlockedCountry && (<span className="text-xs font-medium text-destructive">
                            (Blocked by Spotify)
                        </span>)}
                    </div>
                    <div className="px-2 py-1.5 space-y-1">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                {detectedFlagPath ? (<img src={detectedFlagPath} alt={detectedCountryCode} className="h-3.5 w-4.5 rounded-[2px] border object-cover bg-muted"/>) : (<Globe className="w-4 h-4 opacity-70"/>)}
                                <span className="font-mono text-xs truncate">
                                    {isLoadingCurrentIPInfo
            ? "Detecting..."
            : currentIPInfo
                ? showIPAddress
                    ? `${currentIPInfo.ip} - ${currentIPInfo.country}${detectedCountryCode ? ` (${detectedCountryCode})` : ""}`
                    : `${currentIPInfo.country}${detectedCountryCode ? ` (${detectedCountryCode})` : ""}`
                : "Unavailable"}
                                </span>
                            </div>
                            {currentIPInfo && !isLoadingCurrentIPInfo && (<button type="button" onClick={() => setShowIPAddress((prev) => !prev)} className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" aria-label={showIPAddress ? "Hide IP" : "Show IP"}>
                                {showIPAddress ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}
                            </button>)}
                        </div>
                        {!isLoadingCurrentIPInfo && !currentIPInfo && currentIPInfoError && (<div className="text-xs text-muted-foreground">
                            IP detection unavailable
                        </div>)}
                    </div>
                    <MenubarSeparator />
                    <div className="px-2 py-1.5">
                        <MenubarLabel className="p-0 mb-1.5">Download Source</MenubarLabel>
                        <div className="grid grid-cols-2 gap-1">
                            {SOURCE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSourceChange(opt.value)}
                                    className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                                        downloaderSource === opt.value
                                            ? "bg-primary/15 ring-1 ring-primary/50"
                                            : "hover:bg-muted"
                                    }`}
                                >
                                    <span className={downloaderSource === opt.value ? "text-foreground" : "text-muted-foreground"}>
                                        {opt.label}
                                    </span>
                                    {downloaderSource === opt.value && (
                                        <Check className="w-3 h-3 text-primary shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => openExternal("https://afkarxyz.fyi")} className="gap-2">
                        <Globe className="w-4 h-4 opacity-70"/>
                        <span>Website</span>
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
        <button onClick={handleMinimize} className="w-8 h-7 flex items-center justify-center hover:bg-muted transition-colors rounded" style={{ "--wails-draggable": "no-drag" } as React.CSSProperties} aria-label="Minimize">
          <Minus className="w-3.5 h-3.5"/>
        </button>
        <button onClick={handleMaximize} className="w-8 h-7 flex items-center justify-center hover:bg-muted transition-colors rounded" style={{ "--wails-draggable": "no-drag" } as React.CSSProperties} aria-label="Maximize">
          <Maximize className="w-3.5 h-3.5"/>
        </button>
        <button onClick={handleClose} className="w-8 h-7 flex items-center justify-center hover:bg-destructive hover:text-white transition-colors rounded" style={{ "--wails-draggable": "no-drag" } as React.CSSProperties} aria-label="Close">
          <X className="w-3.5 h-3.5"/>
        </button>
      </div>
    </>);
}
