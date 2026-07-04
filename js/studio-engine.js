/**
 * Modern Technical Notes Studio Pipeline Module
 * Built using pure ES6 Class definitions and standard Object scopes.
 */
class TechnicalNotesStudio {
    constructor() {
        this.editor = document.getElementById('editor');
        this.previewContent = document.getElementById('preview-content');
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
        this.editor.addEventListener('input', () => this.updatePreview());
        this.reloadBtn.addEventListener('click', () => this.hotReload());
        this.exportBtn.addEventListener('click', () => this.exportHTML());

        // Step 4: Verify and pull previous draft properties out of session memory caches
        const storedDraft = sessionStorage.getItem('notes_studio_draft');
        if (storedDraft) {
            this.editor.value = storedDraft;
            this.updatePreview();
        }

        console.log("✔ ES6 Technical Notes Studio engine initialized via clean modules.");
    }

    /**
     * Pulls the raw HTML layout asset document using native async fetches
     */
    async loadExternalTemplateFile() {
        try {
            // Apply cache-busting token so edits to the template load immediately
            const timestamp = Date.now();
            
            const response = await fetch(`studio-panel.html?v=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP network validation exception status: ${response.status}`);
            }
            
            this.rawTemplateText = await response.text();
            console.log("✔ External export layout template file fetched and loaded successfully.");
        } catch (error) {
            console.error("✘ Failed to compile external template asset file:", error);
            this.rawTemplateText = '<html><body>\${bodyPayload}</body></html>';
        }
    }

    /**
     * Dynamic Script Injector: Prevents browser caches from latching onto local code edits
     */
    injectNoCacheAssets() {
        return new Promise((resolve) => {
            const timestamp = Date.now();
            
            // FIXED: Target the explicit head node by pulling index 0 out of the HTMLCollection
            const head = document.getElementsByTagName('head')[0];
            
            const dependencies = ['marked.umd.js', 'prism.js', 'ASCIIMathML.js'];

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
        this.previewContent.innerHTML = marked.parse(rawMarkdownText);
        Prism.highlightAllUnder(this.previewContent);

        if (typeof AMprocessNode === 'function') {
            AMprocessNode(this.previewContent, false);
        }
    }

    /**
     * Flashes active workspace contents into session history right before forcing layout refreshes
     */
    hotReload() {
        sessionStorage.setItem('notes_studio_draft', this.editor.value);
        window.location.reload();
    }

    /**
     * Evaluates the loaded external file string natively as an ES6 template literal closure
     * @param {string} bodyPayload - Parsed document interior content
     * @returns {string} Single complete standalone markup text block
     */
    buildProductionTemplate(bodyPayload) {
        const runtimeEvaluator = new Function('bodyPayload', `return \`${this.rawTemplateText}\`;`);
        return runtimeEvaluator(bodyPayload);
    }

    /**
     * File compile execution workflow pipeline trigger
     */
    exportHTML() {
        const compiledInteriorMarkup = this.previewContent.innerHTML;
        const productionDocumentString = this.buildProductionTemplate(compiledInteriorMarkup);

        const memoryBlob = new Blob([productionDocumentString], { type: 'text/html' });
        const temporaryLink = document.createElement('a');
        temporaryLink.download = 'published-note.html';
        temporaryLink.href = URL.createObjectURL(memoryBlob);
        temporaryLink.click();
    }
}

// Instantiate target class engine object instance and kick off execution thread
const StudioInstance = new TechnicalNotesStudio();
StudioInstance.init();
