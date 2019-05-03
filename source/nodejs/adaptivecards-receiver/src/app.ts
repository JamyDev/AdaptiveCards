// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as AdaptiveCards from "adaptivecards";
import * as MarkdownIt from "markdown-it";
import * as Constants from "./constants";

import { HostContainer } from "./containers/host-container";
import { SkypeContainer } from "./containers/skype";
import { WebChatContainer } from "./containers/webchat";
import { TeamsContainer } from "./containers/teams";
import { ToastContainer } from "./containers/toast";
import { TimelineContainer } from "./containers/timeline";
import { OutlookContainer } from "./containers/outlook";
import { BotFrameworkImageContainer } from "./containers/bf-image";

import { adaptiveCardSchema } from "./adaptive-card-schema";
import { CortanaContainer } from "./containers/cortana";

import { NativeEventSource, EventSourcePolyfill } from "event-source-polyfill";

const EventSource = NativeEventSource || EventSourcePolyfill;

var hostContainerOptions: Array<HostContainerOption> = [];
var hostContainerPicker: HTMLSelectElement;
var lastValidationErrors: Array<AdaptiveCards.IValidationError> = [];
var remoteId: string;

function getSelectedHostContainer(): HostContainer {
    return hostContainerOptions[hostContainerPicker.selectedIndex].hostContainer;
}

function setContent(element) {
    var contentContainer = document.getElementById("content");

    contentContainer.innerHTML = '';
    contentContainer.appendChild(element);
}

function renderCard(target: HTMLElement): HTMLElement {
    document.getElementById("errorContainer").hidden = true;
    lastValidationErrors = [];

    let json = JSON.parse(getCurrentCardPayload());
    let adaptiveCard = new AdaptiveCards.AdaptiveCard();
    adaptiveCard.hostConfig = new AdaptiveCards.HostConfig(currentConfigPayload);

    getSelectedHostContainer().setHostCapabilities(adaptiveCard.hostConfig);

    adaptiveCard.parse(json, lastValidationErrors);

    lastValidationErrors = lastValidationErrors.concat(adaptiveCard.validate());

    showValidationErrors();

    return getSelectedHostContainer().render(adaptiveCard, target);
}

function tryRenderCard() {
    var contentContainer = document.getElementById("content");
    contentContainer.innerHTML = '';

    try {
        renderCard(contentContainer);
    }
    catch (ex) {
        var renderedCard = document.createElement("div");
        renderedCard.innerText = ex.message;
        contentContainer.appendChild(renderedCard);
    }

    try {
		sessionStorage.setItem("AdaptivePayload", getCurrentCardPayload());
		history.replaceState(hostContainerPicker.value, `Visualizer - ${hostContainerPicker.value}`, "index.html" + `?hostApp=${hostContainerPicker.value}&remoteId=${remoteId}`);
    }
    catch (e) {
        console.log("Unable to cache JSON payload.")
    }

    isLoaded = true;
}

function openFilePicker() {
    document.getElementById("filePicker").click();
}

function filePickerChanged(evt) {
    var filePicker = document.getElementById("filePicker") as HTMLInputElement;

    var file = filePicker.files[0];

    if (file) {
        let reader = new FileReader();

        reader.onload = function (e: ProgressEvent) {
            let downloadedPayload = (e.target as FileReader).result;

            if (typeof downloadedPayload === "string") {
                setCurrentCardPayload(downloadedPayload);
            }

            switchToCardEditor();
        }

        reader.readAsText(file);
    }
    else {
        alert("Failed to load file");
    }
}

function loadStyleSheetAndConfig() {
    var styleSheetLinkElement = <HTMLLinkElement>document.getElementById("adaptiveCardStylesheet");

    if (styleSheetLinkElement == null) {
        styleSheetLinkElement = document.createElement("link");
        styleSheetLinkElement.id = "adaptiveCardStylesheet";

        document.getElementsByTagName("head")[0].appendChild(styleSheetLinkElement);
    }

    styleSheetLinkElement.rel = "stylesheet";
    styleSheetLinkElement.type = "text/css";

    var selectedHostContainer = getSelectedHostContainer();
    selectedHostContainer.initialize();

    styleSheetLinkElement.href = selectedHostContainer.styleSheet;

    currentConfigPayload = JSON.stringify(selectedHostContainer.getHostConfig(), null, '\t');

    if (!isCardEditor) {
        monacoEditor.setValue(currentConfigPayload);
    }
}

function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }

    name = name.replace(/[\[\]]/g, "\\$&");

    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");

    var results = regex.exec(url);

    if (results && results[2]) {
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    else {
        return "";
    }
}

class HostContainerOption {
    readonly name: string;
    readonly hostContainer: HostContainer;

    constructor(name: string, hostContainer: HostContainer) {
        this.name = name;
        this.hostContainer = hostContainer;
    }
}

function getCurrentCardPayload() { 
	return monacoEditor.getValue();
}
function setCurrentCardPayload(value: string) {
	monacoEditor.setValue(value);
}
var currentConfigPayload: string = "";
var isLoaded = false;;

function hostContainerPickerChanged() {
    loadStyleSheetAndConfig();

    if (isLoaded) {
        tryRenderCard();
    }
}

function setupContainerPicker() {
    hostContainerPicker = <HTMLSelectElement>document.getElementById("hostContainerPicker");

    hostContainerOptions.push(new HostContainerOption("Bot Framework WebChat", new WebChatContainer("css/webchat.css")));
    hostContainerOptions.push(new HostContainerOption("Cortana Skills", new CortanaContainer(true, "css/cortana.css")));
    hostContainerOptions.push(new HostContainerOption("Microsoft Teams", new TeamsContainer("css/teams.css")));
    hostContainerOptions.push(new HostContainerOption("Outlook Actionable Messages", new OutlookContainer("css/outlook.css")));
    hostContainerOptions.push(new HostContainerOption("Windows Timeline", new TimelineContainer(320, 176, "css/timeline.css")));
    hostContainerOptions.push(new HostContainerOption("Bot Framework Other Channels (Image render)", new BotFrameworkImageContainer(400, "css/bf.css")));
	hostContainerOptions.push(new HostContainerOption("Skype (Preview)", new SkypeContainer(350, "css/skype.css")));
    hostContainerOptions.push(new HostContainerOption("Windows Notifications (Preview)", new ToastContainer(362, "css/toast.css")));

	// hostContainerOptions.push(//     new HostContainerOption(//         "All at once", //         new BotFrameworkImageContainer(400, "css/bf.css")));

    hostContainerPicker.addEventListener("change", hostContainerPickerChanged);

    for (var i = 0; i < hostContainerOptions.length; i++) {
        var option = document.createElement("option");
        option.value = hostContainerOptions[i].name;
        option.text = hostContainerOptions[i].name;

        hostContainerPicker.appendChild(option);
    }
}

function setContainerAppFromUrl() {
	var requestedHostApp = getParameterByName("hostApp", null);

    if (!requestedHostApp) {
        requestedHostApp = hostContainerOptions[0].name;
    }

    console.log(`Setting host app to ${requestedHostApp}`);

    hostContainerPicker.value = requestedHostApp;

    hostContainerPickerChanged();
}

function updateRemoteIdFromUrlChange() {
	var newRemoteId = getParameterByName("remoteId", undefined);
	if (remoteId != newRemoteId) {
		remoteId = newRemoteId;
		remoteIdChanged();
	}
}

var remoteEventSource: EventSource;
var baseRemoteUrl = "https://cardhub.azurewebsites.net/api/";
function remoteIdChanged() {
	if (typeof(EventSource) === "undefined") {
		showErrorCard("Browser not supported");
		return;
	}

	if (remoteEventSource) {
		remoteEventSource.close();
	}

	if (remoteId == undefined || remoteId === "undefined") {
		showErrorCard("No remote ID specified");
		return;
	}

	connect(false);
}

function connect(secondAttempt: boolean) {
	if (!secondAttempt) {
		showConnectingCard();
	}

	remoteEventSource = new EventSource(baseRemoteUrl + "card/" + remoteId + "/subscribe");
	remoteEventSource.onmessage = function(event) {
		console.log("Received message");
		updateFromRemoteCard();
	};
	remoteEventSource.onerror = function() {
		console.log("Disconnected");
		remoteEventSource = undefined;
		if (!secondAttempt) {
			console.log("Attempting reconnect");
			connect(true);
		} else {
			showErrorCard("Disconnected");
		}
	};
	updateFromRemoteCard();
}

var gettingCard = false;
var needsAnotherCard = false;
async function updateFromRemoteCard() {
	if (gettingCard) {
		needsAnotherCard = true;
		return;
	}

	var response = await fetch(baseRemoteUrl + "card/" + remoteId);
	if (!response.ok) {
		showErrorStatus("Failed to get latest card");
	} else {
		var cardData = await response.json();
		setCurrentCardPayload(cardData.CardJson);
		tryRenderCard();
	}

	gettingCard = false;
	if (needsAnotherCard) {
		needsAnotherCard = false;
		updateFromRemoteCard();
	}
}

function showConnectingCard() {
	setCurrentCardPayload(`{
	"$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
	"type": "AdaptiveCard",
	"version": "1.0",
	"body": [
		{
			"type": "Container",
			"items": [
				{
					"type": "TextBlock",
					"text": "Connecting...",
					"weight": "bolder",
					"size": "medium"
				}
			]
		}
	]
}`);
	tryRenderCard();
}

function showErrorCard(message: string) {
	setCurrentCardPayload(`{
	"$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
	"type": "AdaptiveCard",
	"version": "1.0",
	"body": [
		{
			"type": "Container",
			"items": [
				{
					"type": "TextBlock",
					"text": "${message}",
					"weight": "bolder",
					"size": "medium",
					"wrap": "true"
				}
			]
		}
	]
}`);
	tryRenderCard();
}

function showErrorStatus(message: string) {
	console.log("Error: " + message);
}

function setupFilePicker() {
    document.getElementById("loadSample").onclick = () => { document.getElementById("filePicker").click(); };
    document.getElementById("filePicker").addEventListener("change", filePickerChanged);
}

function actionExecuted(action: AdaptiveCards.Action) {
    var message: string = "Action executed\n";
    message += "    Title: " + action.title + "\n";

    if (action instanceof AdaptiveCards.OpenUrlAction) {
        message += "    Type: OpenUrl\n";
        message += "    Url: " + (<AdaptiveCards.OpenUrlAction>action).url + "\n";
    }
    else if (action instanceof AdaptiveCards.SubmitAction) {
        message += "    Type: Submit";
        message += "    Data: " + JSON.stringify((<AdaptiveCards.SubmitAction>action).data);
    }
    else if (action instanceof AdaptiveCards.HttpAction) {
        var httpAction = <AdaptiveCards.HttpAction>action;
        message += "    Type: Http\n";
        message += "    Url: " + httpAction.url + "\n";
        message += "    Method: " + httpAction.method + "\n";
        message += "    Headers:\n";

        for (var i = 0; i < httpAction.headers.length; i++) {
            message += "        " + httpAction.headers[i].name + ": " + httpAction.headers[i].value + "\n";
        }

        message += "    Body: " + httpAction.body + "\n";
    }
    else if (action instanceof AdaptiveCards.ShowCardAction) {
        showPopupCard(<AdaptiveCards.ShowCardAction>action);
        return;
    }
    else {
        message += "    Type: <unknown>";
    }

    alert(message);
}

function showPopupCard(action: AdaptiveCards.ShowCardAction) {
    var overlayElement = document.createElement("div");
    overlayElement.id = "popupOverlay";
    overlayElement.className = "popupOverlay";
    overlayElement.tabIndex = 0;
    overlayElement.style.width = document.documentElement.scrollWidth + "px";
    overlayElement.style.height = document.documentElement.scrollHeight + "px";
    overlayElement.onclick = (e) => {
        document.body.removeChild(overlayElement);
    };

    var cardContainer = document.createElement("div");
    cardContainer.className = "popupCardContainer";
    cardContainer.onclick = (e) => { e.stopPropagation() };

    var cardContainerBounds = cardContainer.getBoundingClientRect();
    cardContainer.style.left = (window.innerWidth - cardContainerBounds.width) / 2 + "px";
    cardContainer.style.top = (window.innerHeight - cardContainerBounds.height) / 2 + "px";

    overlayElement.appendChild(cardContainer);
    document.body.appendChild(overlayElement);

    var hostContainer = getSelectedHostContainer();
    hostContainer.render(action.card, cardContainer);
}

function showValidationErrors() {
    if (lastValidationErrors.length > 0) {
        var errorContainer = document.getElementById("errorContainer");
        errorContainer.innerHTML = "";

        for (var i = 0; i < lastValidationErrors.length; i++) {
            var errorElement = document.createElement("div");
            errorElement.innerText = lastValidationErrors[i].message;

            errorContainer.appendChild(errorElement);
        }

        errorContainer.hidden = false;
    }
}

var isCardEditor = true;

function switchToCardEditor() {
    isCardEditor = true;

    document.getElementById("editCard").classList.remove("subdued");
    document.getElementById("editConfig").classList.add("subdued");

    monacoEditor.setValue(getCurrentCardPayload());
    monacoEditor.focus();
}

function switchToConfigEditor() {
    isCardEditor = false;

    document.getElementById("editCard").classList.add("subdued");
    document.getElementById("editConfig").classList.remove("subdued");

    monacoEditor.setValue(currentConfigPayload);
    monacoEditor.focus();
}

function inlineCardExpanded(action: AdaptiveCards.ShowCardAction, isExpanded: boolean) {
    alert("Card \"" + action.title + "\" " + (isExpanded ? "expanded" : "collapsed"));
}

function elementVisibilityChanged(element: AdaptiveCards.CardElement) {
    alert("An element is now " + (element.isVisible ? "visible" : "invisible"));
}

declare var monacoEditor: any;

// Monaco loads asynchronously via a call to require() from index.html
// App initialization needs to happen after.
declare function loadMonacoEditor(schema: any, callback: () => void);

function monacoEditorLoaded() {
    AdaptiveCards.AdaptiveCard.onParseElement = (element: AdaptiveCards.CardElement, json: any) => {
        getSelectedHostContainer().parseElement(element, json);
    }

    AdaptiveCards.AdaptiveCard.onAnchorClicked = (element: AdaptiveCards.CardElement, anchor: HTMLAnchorElement) => {
        return getSelectedHostContainer().anchorClicked(element, anchor);
    }

    currentConfigPayload = Constants.defaultConfigPayload;

    document.getElementById("editCard").onclick = (e) => {
        switchToCardEditor();
    };

    document.getElementById("editConfig").onclick = (e) => {
        switchToConfigEditor();
    };

    AdaptiveCards.AdaptiveCard.onExecuteAction = actionExecuted;
    // Adaptive.AdaptiveCard.onShowPopupCard = showPopupCard;

    /*
    Test additional events:

    Adaptive.AdaptiveCard.onInlineCardExpanded = inlineCardExpanded;
    Adaptive.AdaptiveCard.onElementVisibilityChanged = elementVisibilityChanged;
    */

    // Uncomment to test the onInlineCardExpanded event:
    // Adaptive.AdaptiveCard.onInlineCardExpanded = inlineCardExpanded;

    setupContainerPicker();
	setContainerAppFromUrl();
	updateRemoteIdFromUrlChange();
    setupFilePicker();
    loadStyleSheetAndConfig();

    // Handle Back and Forward after the Container app drop down is changed
    window.addEventListener(
        "popstate",
        function (e) {
			setContainerAppFromUrl();
			updateRemoteIdFromUrlChange();
        });

    monacoEditor.onDidChangeModelContent(
        function (e) {
            if (isCardEditor) {
                // setCurrentCardPayload(monacoEditor.getValue());
            }
            else {
                currentConfigPayload = monacoEditor.getValue();
            }

            tryRenderCard();
        });

    setCurrentCardPayload(Constants.defaultPayload)

    var initialCardLaodedAsynchronously = false;
    var cardUrl = getParameterByName("card", null);

    if (cardUrl) {
        initialCardLaodedAsynchronously = true;

        var xhttp = new XMLHttpRequest();

        xhttp.onload = function () {
            if (xhttp.responseText && xhttp.responseText != "") {
                setCurrentCardPayload(xhttp.responseText);
            }

            switchToCardEditor();
        };

        try {
            xhttp.open("GET", cardUrl, true);
            xhttp.send();
        }
        catch {
            initialCardLaodedAsynchronously = false;
        }
    }

    if (!initialCardLaodedAsynchronously) {
        switchToCardEditor();
    }
}

window.onload = function() {
    loadMonacoEditor(adaptiveCardSchema, monacoEditorLoaded);
};