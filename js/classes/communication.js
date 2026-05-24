class Communication {
    constructor() {
        this.element = document.getElementById('cielo-comm');
        this.timerId = null;
        this.currentMsg = null;
    }

    play(msg, type = "normal") {
        if (this.currentMsg === msg) return;

        this._clearTimer();
        this._updateColor(type);
        this._updateMessageDOM(msg);
        this._setFadeOutTimer(msg.length * 1000);
    }

    _clearTimer() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    _updateColor(type) {
        if (type === "system") {
            this.element.style.color = "#ff3333";
        } else {
            this.element.style.color = "#0f0";
        }
    }

    _updateMessageDOM(msg) {
        this.currentMsg = msg;
        this.element.innerHTML = `[ NAVI : シエロ ]<br>＝ ${msg} ＝`;
        this.element.style.opacity = 1;
    }

    _setFadeOutTimer(duration) {
        this.timerId = setTimeout(() => {
            this.element.style.opacity = 0;
            this.currentMsg = null;
            this.timerId = null;
        }, duration);
    }
}

// export default Communication; // モジュール化時に有効化
