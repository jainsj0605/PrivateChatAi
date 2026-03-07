import { Button } from "./ui/button";

function ProjectInfo({ onClose }: { onClose: () => void }) {
    return (
        <div className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto px-4 py-8 mt-12">
            <div className="prose dark:prose-invert max-w-none">
                <div className="flex items-center justify-between mb-8 pb-4 border-b">
                    <h1 className="text-4xl font-bold m-0 text-primary">Local AI Assistant</h1>
                    <Button onClick={onClose} variant="outline">
                        Back to Chat
                    </Button>
                </div>

                <div className="mb-10">
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        A fully conversational, privacy-first AI assistant that runs entirely offline
                        and locally on your machine.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm">
                        <h3 className="text-2xl font-semibold mt-0 mb-4 flex items-center gap-2">
                            <span className="text-primary text-xl">✨</span> Features
                        </h3>
                        <ul className="space-y-3 m-0 p-0 list-none">
                            <li className="flex items-start gap-3">
                                <div className="mt-1 bg-primary/10 p-1 rounded text-primary">✓</div>
                                <div>
                                    <strong>100% Offline Capability:</strong> Once the model is downloaded via Ollama, no internet connection is required.
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1 bg-primary/10 p-1 rounded text-primary">✓</div>
                                <div>
                                    <strong>Absolute Privacy:</strong> Your chat data never leaves your computer. No telemetry, no cloud servers.
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1 bg-primary/10 p-1 rounded text-primary">✓</div>
                                <div>
                                    <strong>Persistent History:</strong> The application automatically remembers your conversation if you close the tab.
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1 bg-primary/10 p-1 rounded text-primary">✓</div>
                                <div>
                                    <strong>Theming Support:</strong> Native toggle between beautiful Dark and Light modes.
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm">
                        <h3 className="text-2xl font-semibold mt-0 mb-4 flex items-center gap-2">
                            <span className="text-primary text-xl">🚀</span> Technologies Built With
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">React 18</span>
                            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">Vite</span>
                            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">Tailwind CSS</span>
                            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">Zustand</span>
                            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">Radix UI</span>
                            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">Ollama</span>
                            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">TypeScript</span>
                        </div>
                    </div>
                </div>

                <div className="bg-muted p-6 rounded-lg border text-sm">
                    <h4 className="mt-0 font-semibold mb-2">How it works under the hood</h4>
                    <p className="m-0 mb-2">
                        This project acts as an elegant frontend GUI wrapped around the local <code>localhost:11434</code>
                        Ollama API. It streams generation tokens directly over HTTP, converting Markdown into rendered
                        HTML, and manages complex conversational states purely in memory and LocalStorage.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ProjectInfo;
