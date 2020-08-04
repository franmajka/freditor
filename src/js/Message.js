'use strict'

/** Class representing a message */
export default class Message {
    static messagesList = []; // List with Message objects
    static $messagesList; // List with message HTML elements

    /** Creates message HTMLDivElement */
    constructor() {
        this.$element = document.createElement('div');
        this.$element.classList.add('message');
        this.removing = false;
        this.grabbing = false;
        Message.messagesList.push(this)
    }

    /**
     * Sets the class success/error
     * @param {boolean} bool
     */
    set success(bool) {
        if (typeof bool !== 'boolean') throw new Error('The property receives only boolean');

        if (!this.$element.classList.contains('error') && !this.$element.classList.contains('success')) {
            this.$element.classList.add(bool ? 'success' : 'error');
            return true
        }

        if (this.$element.classList.contains('success') && bool) return true
        if (this.$element.classList.contains('error') && !bool) return true

        this.$element.classList.replace(bool ? 'error' : 'success', bool ? 'success' : 'error');
        return true
    }

    /**
     * Sets the textContent
     * @param {string} text
     */
    set textContent(text) {
        this.$element.textContent = text;
        return true
    }

    /**
     * Sets the class grabbing/grab and as a result prevents removing while grabbing
     * @param {boolean} bool
     */
    set grabbing(bool) {
        if (typeof bool !== 'boolean') throw new Error('The property receives only boolean');

        if (!this.$element.classList.contains('grabbing') && !this.$element.classList.contains('grab')) {
            this.$element.classList.add(bool ? 'grabbing' : 'grab');
            return true
        }

        if (this.$element.classList.contains('grabbing') && bool) return true
        if (this.$element.classList.contains('grab') && !bool) return true

        this.$element.classList.replace(bool ? 'grab' : 'grabbing', bool ? 'grabbing' : 'grab');

        if (this.removing) Message.remove(this);
        return true
    }

    /**
     * Gets the state of message
     * @return {boolean}
     */
    get grabbing() {
        return this.$element.classList.contains('grabbing');
    }

    /**
     * Gets the HTML representation of the message
     * @return {HTMLDivElement} The HTML representation of the message
     */
    get HTML() {
        return this.$element
    }

    /**
     * Returns or creates and then returns the list of messages
     * @return {HTMLDivElement} The list of messages
     */
    static get messagesListElement() {
        if (Message.$messagesList) return Message.$messagesList;

        let messagesListElement = document.querySelector('.messages_list')
        if (messagesListElement) {
            Message.$messagesList = messagesListElement;
            return messagesListElement;
        }

        messagesListElement = document.createElement('div')
        messagesListElement.classList.add('messages_list')
        document.body.appendChild(messagesListElement)
        Message.$messagesList = messagesListElement;

        return messagesListElement
    }

    /**
     * Gets the Message object from HTML Element if it's in the list
     * @param {HTMLDivElement} messageElement HTML representation of message
     */
    static getMessage(messageElement) {
        return Message.messagesList.find(message => message.HTML === messageElement)
    }

    /**
     * Deletes message from messagesList so the garbage collector can delete the object
     * @param {Message} message Message that will be deleted
     */
    static delete(message) {
        let index = Message.messagesList.indexOf(message);
        if (~index) Message.messagesList.splice(index, 1);
    }

    /**
     * Appends message to the DOM and moves other messages with transition
     * @param {Message} messageElement Message that will be appended
     */
    static append(message){
        let messagesListElement = Message.messagesListElement;
        let messageElement = message.HTML;

        messagesListElement.prepend(messageElement);
        let style = messageElement.currentStyle || getComputedStyle(messageElement);

        let margin = parseInt(style.fontSize); // 1em
        messageElement.style.top = -(messageElement.offsetHeight + margin) + 'px';

        let messagesHeight = 0;
        for (let msg of messagesListElement.children) {
            msg.style.top = `${(parseInt(msg.style.top) || 0) + messageElement.offsetHeight + margin}px`;
            messagesHeight += msg.offsetHeight + margin;
        }

        message.timeoutId = setTimeout(Message.remove, 10000, message);

        if (messagesHeight > document.documentElement.clientHeight) {
            let last = Message.getMessage(Message.messagesListElement.lastElementChild);
            while (last.removing) {
                last = Message.getMessage(last.HTML.previousElementSibling);
                if (last === undefined) return
            };
            Message.remove(last);
        }
    }

    /**
     * Removes message from the page
     * @param {Message} messageElement Message that will be removed
     */
    static remove(message){
        if (!message instanceof Message) return;
        message.removing = true;

        if (message.grabbing) return;

        let messagesListElement = Message.messagesListElement;
        let messageElement = message.HTML;

        let style = messageElement.currentStyle || getComputedStyle(messageElement);
        let margin = parseInt(style.fontSize);

        let pos = [].indexOf.call(messagesListElement.children, messageElement);
        if (!~pos) return messageElement.remove();

        for (let msg of [].slice.call(messagesListElement.children, pos + 1)) {
            msg.style.top = `${(parseInt(msg.style.top) || 0) - (messageElement.offsetHeight + margin)}px`;
        }

        messageElement.style.right = `${-(messageElement.offsetWidth + margin)}px`;

        messageElement.ontransitionend = function () {
            this.remove();
            Message.delete(message);
            if (message.timeoutId) clearInterval(message.timeoutId);
        };
    }
}

window.addEventListener('load', () => {
    Message.messagesListElement.addEventListener('mousedown', e => {
        const messageElement = e.target;
        const message = Message.getMessage(messageElement);

        if (!message || message.removing) return

        const style = messageElement.currentStyle || getComputedStyle(messageElement);
        const originalTransition = style.transition;
        messageElement.style.transition = 'all 0s';

        message.grabbing = true;

        const pos = messageElement.getBoundingClientRect()

        const shiftX = pos.right - e.clientX - parseInt(style.right);

        const moveMessage = e => {
            const right = -(e.clientX - pos.right + shiftX)
            messageElement.style.right = right < 0 ? `${right}px` : '0px';
        };

        document.addEventListener('mousemove', moveMessage);

        const originalOnmouseup = document.onmouseup
        document.onmouseup = () => {
            document.removeEventListener('mousemove', moveMessage);
            document.onmouseup = originalOnmouseup;

            message.grabbing = false;

            messageElement.style.transition = originalTransition;
            if (message.removing) return;
            if (-parseInt(messageElement.style.right) > messageElement.offsetWidth / 3) {
                Message.remove(message)
            } else {
                messageElement.style.right = '0px';
            }
        };
    })
})
