const InputManager = {
    keys: {},
    mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2, leftDown: false, rightDown: false },

    init: function() {
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });

        window.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', e => {
            if (e.button === 0) this.mouse.leftDown = true;
            if (e.button === 2) this.mouse.rightDown = true;
        });

        window.addEventListener('mouseup', e => {
            if (e.button === 0) this.mouse.leftDown = false;
            if (e.button === 2) this.mouse.rightDown = false;
        });

        window.addEventListener('contextmenu', e => e.preventDefault());
    },

    isPressed: function(keyCode) {
        return !!this.keys[keyCode];
    },

    getMouse: function() {
        return this.mouse;
    }
};

InputManager.init();
