/**
 * Modern Technical Notes Studio Pipeline Module
 * Built using pure ES6 Class definitions and standard Object scopes.
 * Configured using strict Absolute Paths.
 */
class TechnicalNotesStudio {
    constructor() {
        this.editor = document.getElementById('editor');
        this.previewContent = document.getElementById('preview-content');
        this.saveBtn = document.getElementById('save-btn');
        this.reloadBtn = document.getElementById('reload-btn');
        this.exportBtn = document.getElementById('export-btn');
        
        // Track the raw external layout document contents in memory
        this.rawTemplateText = '';
    }

    /**
     * Executes the hot runtime asset injections and configures event hook bindings
     */
    async init() {
        // Step 1: Force cache-busting loading sweeps across static framework files
        await this.injectNoCacheAssets();

        // Step 2: Programmatically fetch the external layout template file
        await this.loadExternalTemplateFile();

        // Step 3: Establish pure modern event execution loops
        this.saveBtn.addEventListener('click', () => this.updatePreview());
        this.reloadBtn.addEventListener('click', () => this.hotReload());
        this.exportBtn.addEventListener('click', () => this.exportHTML());

        // Step 4: Map Keydown listeners for Command+S / Control+S explicit overrides
        this.editor.addEventListener('keydown', (event) => this.handleKeyboardShortcuts(event));

        // Step 5: Verify and pull previous draft properties out of session memory caches
        const storedDraft = sessionStorage.getItem('notes_studio_draft');
        if (storedDraft) {
            this.editor.value = storedDraft;
            // Give scripts a small window delay to fully register
            setTimeout(() => this.updatePreview(), 250);
        } else {
            // Drop a fallback layout directly into the preview to confirm it's alive visually
            this.previewContent.innerHTML = "<p style='color:#a0aec0; font-style:italic;'>Type your notes on the left and press Cmd+S to compile...</p>";
        }

        console.log("✔ ES6 Technical Notes Studio engine initialized via explicit save framework.");
    }

    /**
     * Catches keystroke actions and intercepts standard browser saving workflows
     */
    handleKeyboardShortcuts(event) {
        const isSaveKey = event.key.toLowerCase() === 's';
        const isMetaPressed = event.metaKey || event.ctrlKey;

        if (isMetaPressed && isSaveKey) {
            event.preventDefault();
            this.updatePreview();
            
            const badge = document.querySelector('.dev-badge');
            if (badge) {
                badge.textContent = "✔ Draft Saved & Compiled";
                badge.style.color = "#4af626";
                setTimeout(() => {
                    badge.textContent = "ES6 Explicit Save Active";
                    badge.style.color = "#a0aec0";
                }, 1500);
            }
        }
    }

    /**
     * Pulls the raw HTML layout asset document using native async fetches
     */
    async loadExternalTemplateFile() {
        try {
            const timestamp = Date.now();
            const response = await fetch(`studio-preview.html?v=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP network validation exception status: ${response.status}`);
            }
            
            this.rawTemplateText = await response.text();
            console.log("✔ External export layout template file fetched and loaded successfully.");
        } catch (error) {
            console.error("✘ Failed to compile external template asset file:", error);
            this.rawTemplateText = '<html><body><!-- BODY_PAYLOAD_HOOK --></body></html>';
        }
    }

    /**
     * Dynamic Script Injector: Prevents browser caches from latching onto local code edits
     */
    injectNoCacheAssets() {
        return new Promise((resolve) => {
            const timestamp = Date.now();
            
            // CRUCIAL FIXED INDEX POINTER: Targets the element node directly out of the HTMLCollection
            const head = document.getElementsByTagName('head')[0];

            // 1. DYNAMIC NO-CACHE PRISM CSS INJECTION
            const cssNode = document.createElement('link');
            cssNode.rel = 'stylesheet';
            cssNode.href = `/assets/prism.css?v=${timestamp}`;
            head.appendChild(cssNode);
            
            // 2. ABSOLUTE PATH RESOLUTIONS: Look directly from the active server root folder
            const dependencies = ['/assets/marked.umd.js', '/assets/prism.js', '/assets/ASCIIMathML.js'];

            const loadScriptSequence = (index) => {
                if (index >= dependencies.length) {
                    resolve();
                    return;
                }
                const scriptNode = document.createElement('script');
                scriptNode.src = `${dependencies[index]}?v=${timestamp}`;
                scriptNode.onload = () => loadScriptSequence(index + 1);
                head.appendChild(scriptNode);
            };

            loadScriptSequence(0);
        });
    }

    /**
     * Iterates parsing runs to build structured responsive typography preview updates
     */
    updatePreview() {
        if (typeof marked === 'undefined' || typeof Prism === 'undefined') return;

        let rawMarkdownText = this.editor.value;
        sessionStorage.setItem('notes_studio_draft', rawMarkdownText);

        // THE RAW HTML FREEDOM FIX: 
        // Cleans up tracking whitespace/newlines around raw <pre> codes before Marked parses it.
        // This stops the markdown engine from mistaking your indented code for markdown text blocks.
        rawMarkdownText = rawMarkdownText.replace(/<pre>\s*[\r\n]\s*<code([^>]*)>/g, (match, attributes) => {
            return `<pre><code${attributes}>`;
        });

        // 1. Process Normalized Markdown and HTML elements
        let compiledHtml = "";
        if (typeof marked.parse === 'function') {
            compiledHtml = marked.parse(rawMarkdownText);
        } else if (typeof marked === 'function') {
            compiledHtml = marked(rawMarkdownText);
        } else if (window.marked && typeof window.marked.parse === 'function') {
            compiledHtml = window.marked.parse(rawMarkdownText);
        }

        // Output clean HTML straight into your preview viewport container
        this.previewContent.innerHTML = compiledHtml;

        // 2. Trigger your custom build of Prism
        Prism.highlightAllUnder(this.previewContent);

        // 3. Trigger AsciiMath calculations
        if (typeof AMprocessNode === 'function') {
            AMprocessNode(this.previewContent, false);
        }
        
        console.log("✔ Layout explicitly compiled successfully.");
    }


    /**
     * Flashes active workspace contents into session history right before forcing layout refreshes
     */
    hotReload() {
        sessionStorage.setItem('notes_studio_draft', this.editor.value);
        window.location.reload();
    }

    /**
     * Structural Exporter Token Swapping Logic Pass
     */
    buildProductionTemplate(bodyPayload) {
        return this.rawTemplateText.replace('<!-- BODY_PAYLOAD_HOOK -->', bodyPayload);
    }

    /**
     * File compile execution workflow pipeline trigger
     */
    exportHTML() {
        const compiledInteriorMarkup = this.previewContent.innerHTML;
        const productionDocumentString = this.buildProductionTemplate(compiledInteriorMarkup);

        const memoryBlob = new Blob([productionDocumentString], { type: 'text/html' });
        const temporaryLink = document.createElement('a');
        temporaryLink.download = 'studio-output.html';
        temporaryLink.href = URL.createObjectURL(memoryBlob);
        temporaryLink.click();
    }
}

// Instantiate target class engine object instance and kick off execution thread
const StudioInstance = new TechnicalNotesStudio();
StudioInstance.init();
