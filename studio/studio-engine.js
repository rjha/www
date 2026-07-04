/**
 * Modern Technical Notes Studio Pipeline Module
 * Built using pure ES6 Class definitions and standard Object scopes.
 * Configured using strict Absolute Paths with Resizable Splitter and Status Metrics.
 */
class TechnicalNotesStudio {

    constructor() {

        this.editor = document.getElementById('editor');
        this.previewContent = document.getElementById('preview-content');
        this.saveBtn = document.getElementById('save-btn');
        this.reloadBtn = document.getElementById('reload-btn');
        this.exportHtmlBtn = document.getElementById('export-html-btn');
        this.exportNoteBtn = document.getElementById('export-note-btn');
        this.statusBadge = document.getElementById('status-badge');
        
        // theme selector
        this.themeDropdown = document.getElementById('theme-dropdown');
        // Splitter DOM nodes properties mapping
        this.workspace = document.getElementById('workspace');
        this.editorPane = document.getElementById('editor-pane');
        this.splitter = document.getElementById('splitter');
        
        this.rawTemplateText = '';
        this.isResizing = false;
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
        this.exportHtmlBtn.addEventListener('click', () => this.exportHTML());
        this.exportNoteBtn.addEventListener('click', () => this.exportNote());

        // Configure theme presets on initialization pass
        this.themeDropdown.addEventListener('change', () => this.changeEditorTheme());
        this.editor.classList.add('theme-light');

        // Step 4: Map Keydown listeners for Command+S / Control+S explicit overrides
        this.editor.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Step 5: STATUS TUNING INTERCEPTOR: Warn immediately if textual changes are un-saved
        this.editor.addEventListener('input', () => this.handleUnsavedStatusChange());

        // Step 6: INITIALIZE SLIDABLE SPLITTER EVENT LOOP MAPPINGS
        this.splitter.addEventListener('mousedown', (e) => this.startResize(e));
        document.addEventListener('mousemove', (e) => this.dragResize(e));
        document.addEventListener('mouseup', () => this.stopResize());

        // Step 7: Verify and pull previous draft properties out of session memory caches
        const storedDraft = sessionStorage.getItem('notes_studio_draft');
        if (storedDraft) {
            this.editor.value = storedDraft;
            setTimeout(() => this.updatePreview(), 250);
        }

        console.log("✔ ES6 Technical Notes Studio engine initialized via explicit save framework.");
    }

    /**
     * Toggles badge state warning colors when current inputs diverge from static previews
     */
    handleUnsavedStatusChange() {
        if (this.statusBadge.textContent !== "✍ Unsaved Changes") {
            this.statusBadge.textContent = "✍ Unsaved Changes";
            this.statusBadge.style.color = "#ecc94b"; /* Warning amber yellow */
        }
    }

    /**
     * Activates mouse sliding coordinates metrics calculation hooks
     */
    startResize(e) {
        this.isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none'; // Block text highlighting during drags
    }

    /**
     * Drag Resize Handler: Coordinates width boundaries fluidly across the canvas wrapper grid
     */
    dragResize(e) {
        if (!this.isResizing) return;
        
        const workspaceRect = this.workspace.getBoundingClientRect();
        const pointerOffsetLeft = e.clientX - workspaceRect.left;
        
        // Establish layout boundary constraints (Minimum 10% width / Maximum 90% width)
        const minBound = workspaceRect.width * 0.1;
        const maxBound = workspaceRect.width * 0.9;
        
        if (pointerOffsetLeft >= minBound && pointerOffsetLeft <= maxBound) {
            const widthPercentage = (pointerOffsetLeft / workspaceRect.width) * 100;
            
            // FIXED: Balance both container grids at the same time to unblock rightward movement
            this.editorPane.style.width = `${widthPercentage}%`;
            
            const previewPane = document.getElementById('preview-pane');
            if (previewPane) {
                previewPane.style.width = `${100 - widthPercentage}%`;
            }
        }
    }


    /**
     * Terminates movement listeners loops cleanly on click release
     */
    stopResize() {
        if (!this.isResizing) return;
        this.isResizing = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
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

        const rawMarkdownText = this.editor.value;
        sessionStorage.setItem('notes_studio_draft', rawMarkdownText);

        // --- STEP 1: ISOLATE THE SOURCE CODE BLOCKS ---
        const sourceCodePattern = /<div class="source-code">([\s\S]*?)<\/div>/g;
        const savedCodeBlocks = [];

        const preprocessedText = rawMarkdownText.replace(sourceCodePattern, (match, interiorContent) => {
            savedCodeBlocks.push(interiorContent);
            return `<!--SOURCE_CODE_HOLDER_${savedCodeBlocks.length - 1}-->`;
        });

        // --- STEP 2: RUN THE MARKDOWN COMPILER ---
        let compiledHtml = "";
        if (typeof marked.parse === 'function') {
            compiledHtml = marked.parse(preprocessedText);
        } else if (typeof marked === 'function') {
            compiledHtml = marked(preprocessedText);
        } else if (window.marked && typeof window.marked.parse === 'function') {
            compiledHtml = window.marked.parse(preprocessedText);
        }

        // --- STEP 3: RE-INJECT CODES INTO PREVIEW PANE ---
        savedCodeBlocks.forEach((codeMarkup, index) => {
            const anchorToken = `<!--SOURCE_CODE_HOLDER_${index}-->`;
            const replacementHtml = `<div class="source-code">${codeMarkup}</div>`;
            compiledHtml = compiledHtml.replace(anchorToken, replacementHtml);
        });

        this.previewContent.innerHTML = compiledHtml;
        Prism.highlightAllUnder(this.previewContent);

        if (typeof AMprocessNode === 'function') {
            AMprocessNode(this.previewContent, false);
        }
        
        // Reset status message back to confirmation layouts
        this.statusBadge.textContent = "✔ Saved & Compiled";
        this.statusBadge.style.color = "#4af626"; /* Emerald green lock accent */
        console.log("✔ Layout explicitly compiled successfully with raw code isolation.");
    }

    /**
     * Flashes active workspace contents into session history right 
     * before forcing layout refreshes
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
     * export preview panel content to studio-output.html file
     */
    exportHTML() {
        const compiledInteriorMarkup = this.previewContent.innerHTML;
        const productionDocumentString = this.buildProductionTemplate(compiledInteriorMarkup);

        const memoryBlob = new Blob([productionDocumentString], { type: 'text/html' });
        const temporaryLink = document.createElement('a');
        temporaryLink.download = 'xstudio-output.html';
        temporaryLink.href = URL.createObjectURL(memoryBlob);
        temporaryLink.click();
    }

    /**
     * save editor panel content to studio-source.md file
     */
    exportNote() {
        const rawNoteData = this.editor.value;
        const memoryBlob = new Blob([rawNoteData], { type: 'text/markdown;charset=utf-8' });
        
        const fileAnchor = document.createElement('a');
        fileAnchor.download = 'xstudio-source.md';
        fileAnchor.href = URL.createObjectURL(memoryBlob);
        fileAnchor.click();
        console.log("✔ Raw markdown file exported to local system disk space.");
    }

    /**
     * set the theme
     */
    changeEditorTheme() {
        const selectedTheme = this.themeDropdown.value;
        
        // Strip any previously applied theme helper tags out of the tracking list
        this.editor.classList.remove('theme-light', 'theme-slate', 'theme-dark');
        
        // Inject the newly designated theme helper class onto your editor node
        this.editor.classList.add(selectedTheme);
        
        // Save your theme choice to localStorage so the canvas state persists across browser reloads
        localStorage.setItem('notes_studio_theme_preset', selectedTheme);
        this.editor.focus();
    }



}


// Instantiate target class engine object instance and kick off execution thread
const StudioInstance = new TechnicalNotesStudio();
StudioInstance.init();
