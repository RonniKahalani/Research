"use strict"
/*
Copyright (c) 2025 Ronni Kahalani

X: https://x.com/RonniKahalani
Website: https://learningisliving.dk
LinkedIn: https://www.linkedin.com/in/kahalani/

Permission is hereby granted, free of charge, to any person obtaining a copy  
of this software and associated documentation files (the "Software"), to deal  
in the Software without restriction, including without limitation the rights  
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell  
copies of the Software, and to permit persons to whom the Software is  
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all  
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  
SOFTWARE.
*/

const LOCAL_ITEM_API_KEY = "api-key";
const LOCAL_ITEM_COMPANIES= "companies";

const MSG_ENTER_APIKEY = "Please enter a valid ChatGPT API key.\n\nThe API key will be enchrypted and saved in local browser storage.";
const MSG_PROVIDE_APIKEY = "You need to provide a valid ChatGPT API key to use this page.";

const MSG_NO_API_KEY_ASK_USER = "No API key in local storage, asking user for a key.";
const MSG_NO_VALID_API_KEY_FROM_USER = "User did not provide a valid API key.";
const MSG_API_KEY_SAVED = "API key saved to local storage.";
const MSG_API_KEY_FOUND = "API key found in local storage.";

const DEFAULT_API_KEY = "your-api-key";
let apiKey = DEFAULT_API_KEY;

let companies = [];

const SCHOLAR_URL = 'https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=';
const GOOGLE_URL = 'https://www.google.com/search?q=';

const companyList = document.querySelector('#company-list');
const companyName = document.querySelector('#company-name');
const companyId = document.querySelector('#company-id');
const companyWebsite = document.querySelector('#company-website');
const query = document.querySelector('#query');
const gptModel = document.querySelector('#gpt-model');
const btnSearch = document.querySelector('#btn-search');
const userPrompt = document.querySelector('#user-prompt');
const systemPrompt = document.querySelector('#system-prompt');
const selectCompany = document.querySelector('#select-company');

const aiContent = document.querySelector('#ai-content');
const googleContent = document.querySelector('#google-content');
const companyContent = document.querySelector('#company-content');

const maxTokens = document.querySelector('#max-tokens');
const spinner = document.querySelector('#spinner');

btnSearch.onclick = () => search();
selectCompany.onchange = (e) => companySelected(e);


function companySelected(e) {
    const selectedCompany = companies.find(company => company.id === e.target.value);
    if (selectedCompany) {
        companyName.value = selectedCompany.name || '';
        companyId.value = selectedCompany.id || '';
        companyWebsite.value = selectedCompany.website || '';
    }
}

/**
 * Returns the payload for the fetch request.
 * @returns 
 */
function getPayload() {

    const prompt = userPrompt.value.replaceAll('$query', query.value).replaceAll('$company', companyName.value);
    return {
        model: gptModel.value,
        messages: [
            { "role": "system", "content": systemPrompt.value},
            { "role": "user", "content": prompt}
        ]
    };
}

/**
 * Returns the settings for the fetch request.
 * @returns 
 */
function getSettings() {
    return {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${atob( localStorage.getItem(LOCAL_ITEM_API_KEY))}`,
        },
        body: JSON.stringify(getPayload()),
    };
}

/**
 * Search for the given query in relation to the company name, id and website.
 */
async function search() {

    if (!companyName.value || !query.value || !companyId.value || !companyWebsite.value) {
        alert('Please fill in all fields');
        return;
    }

    let company = null;
    const index = companies.findIndex(company => company.id === companyId.value);
    if(index !== -1) {
        company = companies[index];
    } else {
        company = { id: companyId.value};
        companies.push(company);
    }

    company.name = companyName.value;
    company.website = companyWebsite.value;

    localStorage.setItem(LOCAL_ITEM_COMPANIES, JSON.stringify(companies));

    spinner.style.display = "block";
    aiContent.innerHTML = "";

    renderCompanyUI();
    renderGoogleSearchUI();

    const response = await fetch('https://api.openai.com/v1/chat/completions', getSettings());
    const data = await response.json();
    if (response.ok) {

        if (data.choices && data.choices.length > 0) {

            const content = data.choices[0].message.content;
            renderAIResponseUI(content);

        } else {
            console.error('Error: No response from ChatGPT');
        }
    } else {
        console.error('Error:', response.statusText !== "" ? response.statusText : data.error.message);
    }
    spinner.style.display = "none";

    updateUI();

}

/**
 * Renders the company information UI.
 */
function renderCompanyUI() {

    const virkLink = `<button class="btn btn-sm btn-primary" onclick="window.open('https://datacvr.virk.dk/enhed/virksomhed/${companyId.value}?fritekst=${companyName.value}%20&sideIndex=0&size=10','_blank')">Virk profile</button>`;
    companyContent.innerHTML = `
    <div class="card">
        <div class="card-header">
            <h4 class="card-title">${companyName.value} (${companyId.value})</h4>
            ${virkLink} 
        </div>
    </div>`
}

/**
 * Creates a Google search link.
 * @param {*} type 
 * @param {*} title 
 * @returns 
 */
function createGoogleLink(type, title) {

    const googleLink = `<button class="btn btn-sm btn-primary" onclick="openGoogleSearch('$type')">$title</button>`;
    return googleLink.replaceAll('$type', type).replaceAll('$title', title);
}

/**
 * Renders the Google search section.
 * @param {*} title 
 * @param {*} icon 
 * @param {*} type 
 * @returns 
 */
function renderGoogleLinkSection(title, icon, type) {

    return `<div class="row col-sm">
        <i class="bi bi-${icon} icon mx-1 h5" title="Search across the world."><br>${title}</i>
        <div class="row m-0 p-0">
            <div class="col-sm"></div>
            <div class="col-sm m-0 p-0">${createGoogleLink(type + '-text', 'Text')}</div>
            <div class="col-sm m-0 p-0">${createGoogleLink(type + '-pdf', 'PDF')}</div>
            <div class="col-sm"></div>
        </div>
    </div>`;
}

/**
 * Renders the Google search UI.
 */
function renderGoogleSearchUI() {

    googleContent.innerHTML = `<div class="card">
    <div class="card-header">
        <h4 class="card-title">Google Search</h4>

        <div class="row text-center">
            
            <div class="col-sm"></div>
        
            <div class="row col-8">
            ${renderGoogleLinkSection('All of Google', 'globe', 'global')}
            ${renderGoogleLinkSection('Company Website', 'building', 'company')}  
            ${renderGoogleLinkSection('Scholar Publications', 'book', 'scholar')}
            </div>

            <div class="col-sm"></div>
        </div>
    </div>`;
}

/**
 * Renders the AI response UI.
 * @param {*} data 
 */
function renderAIResponseUI(data) {
    aiContent.innerHTML = `<div class="card">
        <div class="card-header">
            <h4 class="card-title">AI Response</h4>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-12">
${marked.parse(data)}
                </div>
            </div>
        </div>
    </div>`
}


/**
 * Returns the host of an url.
 * @param {*} url 
 * @returns 
 */
function getHost(url) {
    try {
        return new URL(url).hostname;
    } catch (error) {
        console.error("Invalid URL:", error);
        return null;
    }
}

const SearchType = {
    GLOBAL_TEXT: 'global-text',
    GLOBAL_PDF: 'global-pdf',
    COMPANY_TEXT: 'company-text',
    COMPANY_PDF: 'company-pdf',
    SCHOLAR_TEXT: 'scholar-text',
    SCHOLAR_PDF: 'scholar-pdf'
};

/**
 * Uses Google site search.
 */
function openGoogleSearch(type) {
    let searchQuery = "(" + encodeURIComponent(query.value) + ")";
    const host = getHost(companyWebsite.value);
    const domain = host.split('.').slice(-2).join('.');

    switch (type) {
        case SearchType.GLOBAL_TEXT:
            searchQuery = companyName.value + ' AND ' + searchQuery;
            break;
        case SearchType.GLOBAL_PDF:
            searchQuery = 'filetype:pdf ' + companyName.value + ' AND ' + searchQuery;
            break;
        case SearchType.COMPANY_TEXT:
            searchQuery = 'site:' + domain + ' ' + searchQuery;
            break;
        case SearchType.COMPANY_PDF:
            searchQuery = 'filetype:pdf site:' + domain + ' AND ' + searchQuery;
            break;
        case SearchType.SCHOLAR_TEXT:
            searchQuery = companyName.value + ' AND ' + searchQuery;
            break;
        case SearchType.SCHOLAR_PDF:
            searchQuery = 'filetype:pdf ' + companyName.value + ' AND ' + searchQuery;
            break;    
        default:
            alert('Invalid search type');
            return; 
    }

    const url = type.startsWith('scholar-') ? SCHOLAR_URL : GOOGLE_URL;
    window.open(url + searchQuery, '_blank');
}

function updateUI() {
    selectCompany.options.length = 0;
    selectCompany.appendChild( new Option('Select a company', '') );
    companies.forEach(company => selectCompany.appendChild( new Option(company.name, company.id)));
}

/**
 * 
 * @returns Returns true if the API key is not set.
 */
function isApiKeyUnset() {
    return apiKey === null || apiKey === "" || apiKey === DEFAULT_API_KEY;
}

/**
 * Checks if an API key is stored in local storage, and prompts the user to enter one if it is not.
 */
function handleApiKey() {

    apiKey = localStorage.getItem(LOCAL_ITEM_API_KEY);

    // Do we have an API key
    if (isApiKeyUnset()) {

        console.log(MSG_NO_API_KEY_ASK_USER);
        // Ask the user for an API key.
        apiKey = prompt(MSG_ENTER_APIKEY, "");

        if (apiKey === null || apiKey === "") {
            console.log(MSG_NO_VALID_API_KEY_FROM_USER);
            alert(MSG_PROVIDE_APIKEY);
        } else {
            // Yes, we've got an API key. Now encode it and save it to local storage.
            localStorage.setItem(LOCAL_ITEM_API_KEY, btoa(apiKey));
            console.log(MSG_API_KEY_SAVED);
        }
    } else {
        console.log(MSG_API_KEY_FOUND);
    }
}

/**
 * Loads the companies from local storage.
 */
handleApiKey();
if(!isApiKeyUnset()) {
    companies = JSON.parse(localStorage.getItem('companies')) || [];
    updateUI();
}
