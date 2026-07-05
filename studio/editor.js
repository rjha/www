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
        // Editor Dropdown menu in main toolbar  
        this.menuWrapper = document.getElementById('editor-menu-wrapper');
        this.menuToggleToolbar = document.getElementById('menu-toggle-toolbar');
        
        // Splitter DOM nodes properties mapping
        this.workspace = document.getElementById('workspace');
        this.editorPane = document.getElementById('editor-pane');
        this.previewPane = document.getElementById('preview-pane'); 
        this.splitter = document.getElementById('splitter');
        
        // Markdown Toolbar Bindings
        this.toolbar = document.getElementById('markdown-toolbar');
        this.closeToolbarBtn = document.getElementById('close-toolbar-btn');
        
        // Double-Click Header Handle Bindings
        this.editorHeader = document.getElementById('editor-header');
        this.previewHeader = document.getElementById('preview-header');
        
        // source file open dialog 
        this.openNoteBtn = document.getElementById('menu-open-source');
        this.currentFileHandle = null;

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

        // Toggle Editor Dropdown Menu
        const mainTrigger = document.getElementById('menu-main-trigger');
        mainTrigger.addEventListener('click', (e) => {
            e.stopPropagation(); // Stops event bubbling so document listener doesn't immediately close it
            this.menuWrapper.classList.toggle('active');
        });
        
        // Close Menu automatically if a click lands 
        // anywhere outside the wrapper container box
        document.addEventListener('click', () => {
            this.menuWrapper.classList.remove('active');
        });

        this.menuToggleToolbar.addEventListener('click', () => {
            this.toolbar.classList.remove('collapsed'); // Explicit open pass
            this.menuWrapper.classList.remove('active');
            this.editor.focus();
        });

        this.closeToolbarBtn.addEventListener('click', () => {
            this.toolbar.classList.add('collapsed'); // Explicit close pass
            this.editor.focus();
        });

        this.openNoteBtn.addEventListener('click', () => this.openNoteFromDisk());

        // Delegate Level 2 Theme Buttons via dataset mappings 
        // inside your menu wrapper container
        this.menuWrapper.addEventListener('click', (e) => {
            const themeButton = e.target.closest('button[data-theme]');
            if (themeButton) {
                this.changeEditorTheme(themeButton.dataset.theme);
                this.menuWrapper.classList.remove('active');
            }
        });

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

        // double quick to expand panel to full screen
        this.editorHeader.addEventListener('dblclick', () => this.togglePaneFocus('editor'));
        this.previewHeader.addEventListener('dblclick', () => this.togglePaneFocus('preview'));

        // Dynamic event delegation handler to trace button data actions cleanly
        this.toolbar.addEventListener('click', (e) => {
            const targetButton = e.target.closest('button');
            if (targetButton && targetButton.dataset.action) {
                this.insertMarkdownTemplate(targetButton.dataset.action);
            }
        });

       

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
            const response = await fetch(`preview.html?v=${timestamp}`);
            
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
     * Shared Core Compiler Pipeline
     * Converts a raw text string into a clean compiled HTML structure with code isolation
     * @param {string} rawText - The unparsed input string out of the editor canvas
     * @returns {string} Fully compiled HTML payload string
     */
    compileMarkdownToHTML(rawText) {

        if (typeof marked === 'undefined') {
            throw new Error(" FATAL: Marked.js parser engine not found. Aborting Compilation ...");
        }

        // --- STEP A: ISOLATE THE SOURCE CODE BLOCKS ---
        const sourceCodePattern = /<div class="source-code">([\s\S]*?)<\/div>/g;
        const savedCodeBlocks = [];

        const preprocessedText = rawText.replace(sourceCodePattern, (match, interiorContent) => {
            savedCodeBlocks.push(interiorContent);
            return `<!--SOURCE_CODE_HOLDER_${savedCodeBlocks.length - 1}-->`;
        });

        // --- STEP B: RUN THE MARKDOWN COMPILER ---
        let compiledHtml = "";
        if (typeof marked.parse === 'function') {
            compiledHtml = marked.parse(preprocessedText);
        } else if (typeof marked === 'function') {
            compiledHtml = marked(preprocessedText);
        } else if (window.marked && typeof window.marked.parse === 'function') {
            compiledHtml = window.marked.parse(preprocessedText);
        }

        // --- STEP C: RE-INJECT SOURCE CODES ---
        savedCodeBlocks.forEach((codeMarkup, index) => {
            const anchorToken = `<!--SOURCE_CODE_HOLDER_${index}-->`;
            const replacementHtml = `<div class="source-code">${codeMarkup}</div>`;
            compiledHtml = compiledHtml.replace(anchorToken, replacementHtml);
        });

        return compiledHtml;
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
     * 
     * update the preview panel 
     * 
     */
    updatePreview() {

        // Call the clean shared compilation helper method
        const sourceMarkdownText = this.editor.value;
        sessionStorage.setItem('notes_studio_draft', sourceMarkdownText);
        const sourceHtml = this.compileMarkdownToHTML(sourceMarkdownText);
        this.previewContent.innerHTML = sourceHtml;
        
        // Let preview have its explicit highlight execution loops safely
        Prism.highlightAllUnder(this.previewContent);
        if (typeof Prism === 'undefined') {
            console.warn("⚠️ Prism.js syntax engine not found. skip syntax highlighting.");
        } else {
            Prism.highlightAllUnder(this.previewContent);
        }

        // Reset status message back to confirmation layouts
        this.statusBadge.textContent = "✔ Saved & Compiled";
        this.statusBadge.style.color = "#4af626";
        console.log("✔ Preview pane parsed cleanly via shared compiler framework.");
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
    buildExportTemplate(bodyPayload) {
        return this.rawTemplateText.replace('<!-- BODY_PAYLOAD_HOOK -->', bodyPayload);
    }


    /**
     * export source panel content to studio-output.html file
     */
    exportHTML() {

        // Read the content of source editor
        const sourceMarkdownText = this.editor.value;
        // Compile the source markup into outputHtml
        const sourceHtml = this.compileMarkdownToHTML(sourceMarkdownText);
        // Merge it safely into your studio-preview.html template envelope
        const exportHtml = this.buildExportTemplate(sourceHtml);

        // Stream the pristine byte stream directly to the local system file saver
        const memoryBlob = new Blob([exportHtml], { type: 'text/html;charset=utf-8' });
        const temporaryLink = document.createElement('a');
        temporaryLink.download = 'xstudio-out.html';
        temporaryLink.href = URL.createObjectURL(memoryBlob);
        temporaryLink.click();
        console.log("✔ HTML web page exported from source editor text.");

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
     * Reads the chosen theme name token and repaints the textarea background on the fly
     * @param {string} targetThemeName - Selected profile class ('theme-light', 'theme-slate', or 'theme-dark')
     */
    changeEditorTheme(targetThemeName) {
        // Strip any previously assigned canvas background tokens out of the tracking list
        this.editor.classList.remove('theme-light', 'theme-slate', 'theme-dark');
        
        // Inject your newly designated background class onto the active editor container node
        this.editor.classList.add(targetThemeName);
        
        // Persist selection choice to local storage
        localStorage.setItem('notes_studio_theme_preset', targetThemeName);
        this.editor.focus();
    }


    /**
     * Toggles workspace layouts cleanly back-and-forth from Fullscreen Focus to Split View
     * @param {string} target - Identified panel map identifier ('editor' or 'preview')
     */
    togglePaneFocus(target) {
        const currentEditorWidth = this.editorPane.style.width || '50%';
        const isCurrentlyMaximized = currentEditorWidth === '100%' || currentEditorWidth === '0%';

        if (isCurrentlyMaximized) {
            // SNAP BACK: If already full size, expand both panes fluidly back to 50/50 comparison grid
            this.editorPane.style.width = '50%';
            this.previewPane.style.width = '50%';
            this.editorPane.style.display = 'flex';
            this.previewPane.style.display = 'flex';
            this.splitter.style.display = 'block';
            
            this.editorHeader.textContent = "📝 SOURCE EDITOR (Double-click to toggle full view)";
            this.previewHeader.textContent = "📖 TYPOGRAPHY PREVIEW (Double-click to toggle full view)";
        } else {
            // EXPAND FOCUS: Scale target container cleanly up to full widescreen viewports
            if (target === 'editor') {
                this.editorPane.style.width = '100%';
                this.previewPane.style.width = '0%';
                this.splitter.style.display = 'none';
                this.editorHeader.textContent = "📝 SOURCE EDITOR ➔ FULLSCREEN MODE ACTIVE (Double-click to return)";
            } else {
                this.editorPane.style.width = '0%';
                this.previewPane.style.width = '100%';
                this.splitter.style.display = 'none';
                this.previewHeader.textContent = "📖 TYPOGRAPHY PREVIEW ➔ FULLPAGE VIEW ACTIVE (Double-click to return)";
            }
        }
        
        this.editor.focus();
    }

    /**
     * Splices designated formatting boilerplate strings precisely into current cursor indices
     * @param {string} action - Targeted markdown structural identity parameter identifier
     */
    insertMarkdownTemplate(action) {
        const startPos = this.editor.selectionStart;
        const endPos = this.editor.selectionEnd;
        const currentText = this.editor.value;
        let snippetText = "";

        switch(action) {
            case 'h1': snippetText = "\n# Heading 1\n"; break;
            case 'h2': snippetText = "\n## Heading 2\n"; break;
            case 'bold': snippetText = "**bold text**"; break;
            case 'italic': snippetText = "*italic text*"; break;
            case 'link': snippetText = "[Softmaxx Website](https://www.softmaxx.online)"; break;
            case 'list': snippetText = "\n* Item Description\n"; break;
            case 'math':
                // space is needed around the $ DELIMS
                snippetText = "\n<div>\n  $ frac{3}{4} = frac{300}{4} times frac{1}{100} = frac{300}{4}% = 75% $  \n</div>\n";
                break;
            case 'code':
                snippetText = "\n<div class=\"source-code\">\n <pre>\n <code class=\"language-python\">\n\tlambda x: x if x<=1 else fib(x-1) + fib(x-2)\n </code>\n </pre>\n</div>\n";
                break;
            case 'photo':
                snippetText = "\n<figure>\n    <img src=\"/media/photos/elephant01.png\" alt=\"Elephant in grassland\">\n    <figcaption>Figure 1: Description of the photo.</figcaption>\n</figure>\n";
                break;
            case 'video':
                snippetText = "\n<div class=\"video-container\">\n [paste the youtube embed code]\n</div>\n";
                break;
        }

        // Insert snippet text into current cursor index parameters
        this.editor.value = currentText.substring(0, startPos) + snippetText + currentText.substring(endPos, currentText.length);
        
        // Return active editor pane cursor focus
        this.editor.focus();
        const updatedIndex = startPos + snippetText.length;
        this.editor.selectionStart = updatedIndex;
        this.editor.selectionEnd = updatedIndex;
        
        // Trigger status warning banner changes
        this.handleUnsavedStatusChange();
    }

    /**
     * Tool: Opens the native OS file explorer to read a markdown file into the editor
     */
    async openNoteFromDisk() {

        if (!window.showOpenFilePicker) {
            alert("Please use a modern browser that supports the native File System Access API.");
            return;
        }

       try {
            const [handle] = await window.showOpenFilePicker({
                types: [{ description: 'Markdown Notes', accept: { 'text/markdown': ['.md'] } }]
            });
            
            // TIMELINE PHASE 1: Immediate hourglass status trigger
            this.statusBadge.textContent = "⏳ Loading Document...";
            this.statusBadge.style.color = "#ecc94b"; /* Warning Gold */
            
            this.currentFileHandle = handle;
            const fileData = await handle.getFile();
            const textContent = await fileData.text();
            
            // TIMELINE PHASE 2: Lock the UI for exactly 1 second (3000ms) to let the loading bar breathe
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // TIMELINE PHASE 3: Drop the source text into the textarea canvas
            this.editor.value = textContent;
            
            // TIMELINE PHASE 4: Compile text and refresh the typography view
            // This method automatically flips the status badge to "✔ Saved & Compiled" (Emerald Green)
            this.updatePreview();

        } catch (err) {
            console.log("User cancelled file selection dialogue box.", err);
        }
    }


}


// Instantiate target class engine object instance and kick off execution thread
const StudioInstance = new TechnicalNotesStudio();
StudioInstance.init();
