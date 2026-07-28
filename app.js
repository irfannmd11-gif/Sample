/********************************************************************
 * Workbook Automation Tool
 * app.js
 *
 * Part 1
 * Initialization
 * Global Variables
 * Utility Functions
 ********************************************************************/

document.addEventListener("DOMContentLoaded", () => {

    initializeApp();

});

/********************************************************************
 * Global Variables
 ********************************************************************/

let workbookData = {};
let workbookName = "";
let selectedSheet = "";
let workbookContext = "";
let offerDescription = "";
let sheetPrompt = "";
let finalPrompt = "";
let isDirty = false;
const promptBuilderDraftKey = "workbook-validation-prompt-builder-draft";

/********************************************************************
 * DOM Elements
 ********************************************************************/

const projectRefInput = document.getElementById("projectRef");
const taskNumberInput = document.getElementById("taskNumber");

const fetchWorkbookBtn = document.getElementById("fetchWorkbookBtn");

const sheetSelector = document.getElementById("sheetSelector");

const workbookNameLabel = document.getElementById("workbookName");

const overallStatus = document.getElementById("overallStatus");

const sheetCount = document.getElementById("sheetCount");

const workbookType = document.getElementById("workbookType");

const lastUpdated = document.getElementById("lastUpdated");

const piiStatus = document.getElementById("piiStatus");

const aiStatus = document.getElementById("aiStatus");

const offerDescriptionArea =
    document.getElementById("offerDescription");

const workbookContextArea =
    document.getElementById("workbookContext");

const sheetPromptArea =
    document.getElementById("sheetPrompt");

const finalPromptArea =
    document.getElementById("finalPrompt");

const gptPreview =
    document.getElementById("gptPreview");

const loadingOverlay =
    document.getElementById("loadingOverlay");

const progressBar =
    document.getElementById("progressBar");

const loadingMessage =
    document.getElementById("loadingMessage");

const toastElement =
    document.getElementById("successToast");

const toastMessage =
    document.getElementById("toastMessage");

const promptStatus =
    document.getElementById("promptStatus");

const previewPromptBtn =
    document.getElementById("previewPromptBtn");

const previewPromptArea =
    document.getElementById("previewPrompt");

const promptPreviewModalElement =
    document.getElementById("promptPreviewModal");

const sectionStatuses = {
    offer: document.getElementById("offerStatus"),
    workbook: document.getElementById("workbookStatus"),
    sheet: document.getElementById("sheetStatus")
};

/********************************************************************
 * Bootstrap Components
 ********************************************************************/

let successToast;

/********************************************************************
 * Initialize
 ********************************************************************/

function initializeApp() {

    successToast =
        new bootstrap.Toast(toastElement);

    registerEvents();

    resetUI();

    restorePromptBuilderDraft();

}

/********************************************************************
 * Register Events
 ********************************************************************/

function registerEvents() {

    fetchWorkbookBtn.addEventListener(

        "click",

        fetchWorkbook

    );

    sheetSelector.addEventListener(

        "change",

        handleSheetSelection

    );

    previewPromptBtn?.addEventListener("click", showPromptPreview);

}

/********************************************************************
 * Reset UI
 ********************************************************************/

function resetUI() {

    workbookNameLabel.textContent = "-";

    overallStatus.textContent = "Waiting";

    sheetCount.textContent = "0";

    workbookType.textContent = "-";

    lastUpdated.textContent = "-";

    piiStatus.textContent = "-";

    aiStatus.textContent = "Idle";

    offerDescriptionArea.value = "";

    workbookContextArea.value = "";

    sheetPromptArea.value = "";

    finalPromptArea.value = "";

    if (gptPreview) {

        gptPreview.value = "";

    }

    updateSectionStatus("offer", "Waiting", "secondary");
    updateSectionStatus("workbook", "Waiting", "secondary");
    updateSectionStatus("sheet", "Waiting", "secondary");

}

function updateSectionStatus(section, label, tone){

    const status=sectionStatuses[section];

    if (!status) return;

    status.textContent=label;
    status.className=`badge bg-${tone}`;

}

function savePromptBuilderDraft(){

    try {

        localStorage.setItem(promptBuilderDraftKey, JSON.stringify({
            offerDescription: offerDescriptionArea.value,
            workbookContext: workbookContextArea.value,
            sheetPrompt: sheetPromptArea.value,
            finalPrompt: finalPromptArea.value
        }));

    } catch (error) {

        console.warn("Unable to save the Prompt Builder draft.", error);

    }

}

function restorePromptBuilderDraft(){

    try {

        const draft=JSON.parse(localStorage.getItem(promptBuilderDraftKey));

        if (!draft) return;

        offerDescriptionArea.value=draft.offerDescription || "";
        workbookContextArea.value=draft.workbookContext || "";
        sheetPromptArea.value=draft.sheetPrompt || "";
        finalPromptArea.value=draft.finalPrompt || "";

        updateGPTPreview();
        updateSectionStatus("offer", "Auto Saved", "success");
        updateSectionStatus("workbook", "Auto Saved", "success");
        updateSectionStatus("sheet", "Auto Saved", "success");
        autoSave();

    } catch (error) {

        console.warn("Unable to restore the Prompt Builder draft.", error);

    }

}

/********************************************************************
 * Loading Overlay
 ********************************************************************/

function showLoading(message = "Loading...") {

    loadingOverlay.classList.remove("d-none");

    loadingMessage.innerHTML = message;

    updateProgress(10);

}

function hideLoading() {

    loadingOverlay.classList.add("d-none");

}

function updateProgress(value) {

    progressBar.style.width = value + "%";

}

/********************************************************************
 * Toast
 ********************************************************************/

function showToast(message) {

    toastMessage.innerHTML = message;

    successToast.show();

}

/********************************************************************
 * Update Status
 ********************************************************************/

function updateStatus(status) {

    overallStatus.innerHTML = status;

}

/********************************************************************
 * Utility
 ********************************************************************/

function today() {

    return new Date().toLocaleDateString();

}

function autoSave() {

    promptStatus.innerHTML =

        "Auto Saved";

}

function setDirty() {

    isDirty = true;

    promptStatus.innerHTML =

        "Needs Regeneration";

}

/********************************************************************
 * Copy To Clipboard
 ********************************************************************/

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(text);

        showToast("Prompt copied successfully.");

    }

    catch (e) {

        console.error(e);

    }

}

/********************************************************************
 * Sync GPT Preview
 ********************************************************************/

function updateGPTPreview() {

    if (gptPreview) {

        gptPreview.value = finalPromptArea.value;

    }

}

/********************************************************************
 * Workbook Fetch
 ********************************************************************/

async function fetchWorkbook() {

    const projectRef = projectRefInput.value.trim();
    const taskNumber = taskNumberInput.value.trim();

    if (!projectRef) {

        showToast("Please enter Project Reference.");

        projectRefInput.focus();

        return;
    }

    if (!taskNumber) {

        showToast("Please enter Task Number.");

        taskNumberInput.focus();

        return;
    }

    try {

        setWorkflowStep(1);

        showLoading("Fetching workbook...");

        updateProgress(15);

        updateStatus("Searching Project");

        setWorkflowStep(2);

        updateStatus("Downloading Workbook");

        fetchWorkbookBtn.disabled = true;

        const response = await fetch("/fetch_workbook", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                project_reference: projectRef,

                task_number: taskNumber

            })

        });

        if (!response.ok) {

            const errorData = await response.json().catch(() => ({}));

            throw new Error(errorData.error || "Unable to fetch workbook.");

        }

        updateProgress(40);

        const data = await response.json();

        workbookData = data;

        setWorkflowStep(3);

        loadWorkbookInformation(data);

        updateProgress(70);

        populateSheetSelector(data.sheets || []);

        updateProgress(90);

        setWorkflowStep(4);

        updateProgress(100);

        hideLoading();

        fetchWorkbookBtn.disabled = false;

        showToast("Workbook loaded successfully.");

    }

    catch (error) {

        console.error(error);

        hideLoading();

        fetchWorkbookBtn.disabled = false;

        showError(error.message);

    }

}

/********************************************************************
 * Workbook Information
 ********************************************************************/

function loadWorkbookInformation(data) {

    workbookNameLabel.textContent =

        data.workbook_name || "-";

    workbookType.textContent =

        data.workbook_type || "-";

    sheetCount.textContent =

        data.sheet_count || 0;

    lastUpdated.textContent =

        today();

    overallStatus.innerHTML =

        "Ready";

    aiStatus.innerHTML =

        "Workbook Loaded";

    piiStatus.innerHTML =

        data.pii_status || "None";

}

/********************************************************************
 * Populate Sheets
 ********************************************************************/

function populateSheetSelector(sheetList) {

    sheetSelector.innerHTML = "";

    const defaultOption = document.createElement("option");

    defaultOption.value = "";

    defaultOption.textContent =

        "Select Sheet";

    sheetSelector.appendChild(defaultOption);

    sheetList.forEach(sheet => {

        const option = document.createElement("option");

        option.value = sheet;

        option.textContent = sheet;

        sheetSelector.appendChild(option);

    });

}

/********************************************************************
 * Sheet Selection
 ********************************************************************/

function handleSheetSelection() {

    selectedSheet = sheetSelector.value;

    if (!selectedSheet) {

        return;

    }

    loadSheetInformation(selectedSheet);

}

/********************************************************************
 * Load Selected Sheet
 ********************************************************************/

function loadSheetInformation(sheetName) {

    const sheet =

        workbookData.sheet_data?.[sheetName];

    if (!sheet) {

        return;

    }

    offerDescriptionArea.value =

        sheet.offer_description || "";

    workbookContextArea.value =

        sheet.workbook_context || "";

    sheetPromptArea.value =

        sheet.sheet_prompt || "";

    finalPromptArea.value =

        sheet.generated_prompt || "";

    setWorkflowStep(5);

    updateGPTPreview();

    updateSectionStatus("offer", "Ready", "success");
    updateSectionStatus("workbook", "Ready", "success");
    updateSectionStatus("sheet", "Ready", "success");

    autoSave();

}

/********************************************************************
 * Error
 ********************************************************************/

function showError(message) {

    const modal = new bootstrap.Modal(

        document.getElementById("errorModal")

    );

    document.getElementById("errorMessage").textContent =

        message;

    modal.show();

}

/********************************************************************
 * Prompt Builder
 * Part 3
 ********************************************************************/

let editMode = {
    offer: false,
    workbook: false,
    sheet: false,
    prompt: false
};

/********************************************************************
 * Register Edit Events
 ********************************************************************/

document.getElementById("editOfferBtn")
    .addEventListener("click", () => toggleEdit("offer"));

document.getElementById("editWorkbookBtn")
    .addEventListener("click", () => toggleEdit("workbook"));

document.getElementById("editSheetBtn")
    .addEventListener("click", () => toggleEdit("sheet"));

document.getElementById("copyPromptBtn")
    .addEventListener("click", copyPrompt);


/********************************************************************
 * Toggle Edit
 ********************************************************************/

function toggleEdit(section){

    switch(section){

        case "offer":
            toggleTextarea(
                offerDescriptionArea,
                "editOfferBtn",
                "offer"
            );
            break;

        case "workbook":
            toggleTextarea(
                workbookContextArea,
                "editWorkbookBtn",
                "workbook"
            );
            break;

        case "sheet":
            toggleTextarea(
                sheetPromptArea,
                "editSheetBtn",
                "sheet"
            );
            break;

        case "prompt":
            toggleTextarea(
                finalPromptArea,
                "editPromptBtn",
                "prompt"
            );
            break;

    }

}

/********************************************************************
 * Generic Edit Handler
 ********************************************************************/

function toggleTextarea(textarea,buttonId,key){

    const btn=document.getElementById(buttonId);

    editMode[key]=true;

    textarea.readOnly=false;

    if(editMode[key]){

        updateSectionStatus(key, "Editing", "warning");

        const collapse=textarea.closest(".collapse");

        if (collapse && !collapse.classList.contains("show")) {

            bootstrap.Collapse.getOrCreateInstance(collapse).show();

            const icon=collapse.closest(".prompt-section")?.querySelector(".accordion-toggle i");

            if (icon) {

                icon.className="bi bi-chevron-down";

            }

        }

        textarea.focus();

        btn.innerHTML=`
            <i class="bi bi-pencil"></i>
            Edit
        `;

        textarea.parentElement.classList.add("editing");

    }

    else{

        btn.innerHTML=`
            <i class="bi bi-pencil"></i>
            Edit
        `;

        textarea.parentElement.classList.remove("editing");

        regeneratePrompt();

        isDirty=false;

        savePromptBuilderDraft();

        updateSectionStatus(key, "Auto Saved", "success");

        autoSave();

    }

}

/********************************************************************
 * Auto Save
 ********************************************************************/

function autoSave(){

    if (!promptStatus) return;

    promptStatus.innerHTML='<i class="bi bi-check-circle-fill me-1"></i> Auto Saved';

    promptStatus.className="badge bg-success px-3 py-2";

}

/********************************************************************
 * Dirty
 ********************************************************************/

function setDirty(){

    isDirty=true;

    if (!promptStatus) return;

    promptStatus.innerHTML='<i class="bi bi-arrow-repeat me-1"></i> Saving...';

    promptStatus.className="badge bg-warning px-3 py-2";

}

/********************************************************************
 * Generate Prompt
 ********************************************************************/

function regeneratePrompt(){

    finalPrompt=[
        "# Workbook Validation Prompt",
        "",
        "Use the following workbook information to complete the requested validation.",
        "",
        "## 1. Offer Description",
        offerDescriptionArea.value.trim(),
        "",
        "## 2. Workbook Context",
        workbookContextArea.value.trim(),
        "",
        "## 3. Sheet Instructions",
        sheetPromptArea.value.trim(),
        "",
        "## Expected Output",
        "Provide clear, actionable validation results based on all sections above."
    ].join("\n\n");

    finalPromptArea.value=finalPrompt;

    updateGPTPreview();

}

async function showPromptPreview(){

    regeneratePrompt();

    if (!await scanPromptForPII()) {

        return;

    }

    setWorkflowStep(6);

    if (previewPromptArea) {

        previewPromptArea.value=finalPromptArea.value;

    }

    if (promptPreviewModalElement) {

        bootstrap.Modal.getOrCreateInstance(promptPreviewModalElement).show();

    }

}

const autoSaveTimers = {};

function scheduleAutoSave(section){

    setDirty();

    updateSectionStatus(section, "Saving...", "warning");

    clearTimeout(autoSaveTimers[section]);

    autoSaveTimers[section]=setTimeout(()=>{

        offerDescription=offerDescriptionArea.value;
        workbookContext=workbookContextArea.value;
        sheetPrompt=sheetPromptArea.value;

        regeneratePrompt();
        isDirty=false;
        savePromptBuilderDraft();
        updateSectionStatus(section, "Auto Saved", "success");
        autoSave();

    }, 400);

}

/********************************************************************
 * GPT Preview
 ********************************************************************/

function updateGPTPreview(){

    if (gptPreview) {

        gptPreview.value=finalPromptArea.value;

    }

}

/********************************************************************
 * Copy Prompt
 ********************************************************************/

async function copyPrompt(){

    try{

        if (!await scanPromptForPII()) {

            return;

        }

        await navigator.clipboard.writeText(
            finalPromptArea.value
        );

        setWorkflowStep(6);

        showToast("Prompt copied successfully.");

    }

    catch(error){

        console.error(error);

    }

}

/********************************************************************
 * Open ChatGPT
 ********************************************************************/

function openChatGPT(){

    window.open(

        "https://chat.openai.com",

        "_blank"

    );

}

/********************************************************************
 * Detect Changes
 ********************************************************************/

offerDescriptionArea.addEventListener(

    "input",

    ()=>{

        scheduleAutoSave("offer");

    }

);

workbookContextArea.addEventListener(

    "input",

    ()=>{

        scheduleAutoSave("workbook");

    }

);

sheetPromptArea.addEventListener(

    "input",

    ()=>{

        scheduleAutoSave("sheet");

    }

);

finalPromptArea.addEventListener(

    "input",

    ()=>{

        setDirty();

        clearTimeout(autoSaveTimers.prompt);

        autoSaveTimers.prompt=setTimeout(()=>{

            isDirty=false;
            updateGPTPreview();
            savePromptBuilderDraft();
            autoSave();

        }, 400);

    }

);

/********************************************************************
 * Workflow Progress
 ********************************************************************/

function setWorkflowStep(stepNumber){

    const steps=document.querySelectorAll(".workflow-step");

    steps.forEach((step,index)=>{

        step.classList.remove("active");
        step.classList.remove("completed");

        if(index+1<stepNumber){

            step.classList.add("completed");

        }

        if(index+1===stepNumber){

            step.classList.add("active");

        }

    });

}

/********************************************************************
 * KPI Cards
 ********************************************************************/

function updateKPICards(data){

    document.getElementById("sheetCount").innerHTML=
        data.sheet_count || 0;

    document.getElementById("workbookType").innerHTML=
        data.workbook_type || "-";

    document.getElementById("overallStatus").innerHTML=
        data.status || "Ready";

    document.getElementById("lastUpdated").innerHTML=
        today();

}

/********************************************************************
 * PII Status
 ********************************************************************/

function updatePIIStatus(result){

    const badge=document.getElementById("piiStatus");

    if(result.has_pii){

        badge.className="badge bg-danger";

        badge.innerHTML=
            result.count + " PII Found";

    }

    else{

        badge.className="badge bg-success";

        badge.innerHTML="No PII";

    }

    const piiResult = document.getElementById("piiResult");

    if (piiResult) {

        piiResult.className = result.has_pii ? "badge bg-danger" : "badge bg-success";

        piiResult.textContent = result.has_pii
            ? `${result.count} PII Found: ${Object.keys(result.types || {}).join(", ")}`
            : "No PII Found";

    }

}

async function scanPromptForPII(){

    try {

        const response = await fetch("/scan_pii", {

            method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({ prompt: finalPromptArea.value })

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(result.error || "Unable to scan the prompt for PII.");

        }

        updatePIIStatus(result);

        if (result.has_pii) {

            showError("PII was detected in the prompt. Remove or mask it before copying or sending the prompt to GPT.");

            return false;

        }

        return true;

    }

    catch (error) {

        console.error(error);

        showError("PII scan could not be completed. The prompt was not sent or copied.");

        return false;

    }

}

/********************************************************************
 * AI Status
 ********************************************************************/

function updateAIStatus(message){

    document.getElementById("aiStatus").innerHTML=
        message;

}

/********************************************************************
 * Progress Animation
 ********************************************************************/

async function animateProgress(){

    showLoading("Processing Workbook...");

    for(let i=0;i<=100;i+=10){

        updateProgress(i);

        await delay(120);

    }

    hideLoading();

}

/********************************************************************
 * Delay
 ********************************************************************/

function delay(ms){

    return new Promise(resolve=>{

        setTimeout(resolve,ms);

    });

}

/********************************************************************
 * Enable Controls
 ********************************************************************/

function enableControls(){

    fetchWorkbookBtn.disabled=false;

    sheetSelector.disabled=false;

    document
        .querySelectorAll("button")
        .forEach(btn=>{

            btn.disabled=false;

        });

}

/********************************************************************
 * Disable Controls
 ********************************************************************/

function disableControls(){

    fetchWorkbookBtn.disabled=true;

    sheetSelector.disabled=true;

    document
        .querySelectorAll(".edit-btn")
        .forEach(btn=>{

            btn.disabled=true;

        });

}

/********************************************************************
 * Keyboard Shortcuts
 ********************************************************************/

document.addEventListener(

    "keydown",

    function(event){

        /* Ctrl + S */

        if(event.ctrlKey && event.key==="s"){

            event.preventDefault();

            autoSave();

            showToast("Prompt Saved");

        }

        /* Ctrl + C */

        if(event.ctrlKey && event.shiftKey && event.key==="C"){

            event.preventDefault();

            copyPrompt();

        }

        /* Ctrl + Enter */

        if(event.ctrlKey && event.key==="Enter"){

            event.preventDefault();

            regeneratePrompt();

        }

    }

);

/********************************************************************
 * Reset Builder
 ********************************************************************/

function clearPromptBuilder(){

    offerDescriptionArea.value="";

    workbookContextArea.value="";

    sheetPromptArea.value="";

    finalPromptArea.value="";

    updateSectionStatus("offer", "Waiting", "secondary");
    updateSectionStatus("workbook", "Waiting", "secondary");
    updateSectionStatus("sheet", "Waiting", "secondary");

    if (gptPreview) {

        gptPreview.value="";

    }

    if (promptStatus) {

        promptStatus.innerHTML="Waiting";

    }

}

/********************************************************************
 * Refresh Builder
 ********************************************************************/

function refreshBuilder(){

    regeneratePrompt();

    updateGPTPreview();

}

/********************************************************************
 * Download Prompt
 ********************************************************************/

function downloadPrompt(){

    const blob=new Blob(

        [finalPromptArea.value],

        {

            type:"text/plain"

        }

    );

    const url=URL.createObjectURL(blob);

    const a=document.createElement("a");

    a.href=url;

    a.download="Generated_Prompt.txt";

    a.click();

    URL.revokeObjectURL(url);

}

/********************************************************************
 * Character Counter
 ********************************************************************/

function updateCharacterCount(){

    const total=finalPromptArea.value.length;

    const counter=document.getElementById("characterCount");

    if(counter){

        counter.innerHTML=total+" Characters";

    }

}

/********************************************************************
 * Sync Events
 ********************************************************************/

[
offerDescriptionArea,
workbookContextArea,
sheetPromptArea,
finalPromptArea

].forEach(element=>{

    element.addEventListener(

        "input",

        ()=>{

            updateCharacterCount();

            updateGPTPreview();

        }

    );

});

/********************************************************************
 * API Error Handler
 ********************************************************************/

function handleApiError(error){

    console.error(error);

    hideLoading();

    showError(

        error.message ||

        "Unexpected server error."

    );

}

/********************************************************************
 * Initialize Builder
 ********************************************************************/

function initializeBuilder(){

    clearPromptBuilder();

    updateCharacterCount();

    setWorkflowStep(1);

    updateAIStatus("Waiting");

}

/********************************************************************
 * Application Ready
 ********************************************************************/

window.addEventListener(

    "load",

    ()=>{

        initializeBuilder();

        console.log(

            "Workbook Automation Tool Ready"

        );

    }

);
