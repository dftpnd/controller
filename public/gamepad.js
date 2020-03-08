const socket = io();
const rAF = window.mozRequestAnimationFrame || window.requestAnimationFrame;

const motorAdapter = ({ pressed, value }) => {
    if (pressed) {
        console.log('Math.round(value * 100);', Math.round(value * 100))
        return Math.round(value * 100);
    }

    return 0;
}

const LEFT_HUMMER = 7;
const RIGHT_HUMMER = 6;
const LEFT_ARROW = 14;
const RIGHT_ARROW = 15;
const TOP_ARROW = 12;
const BOTTOM_ARROW = 13;

const  updateLoop = () => {
    const gamepad = navigator.getGamepads()[0];
    const { buttons, axes } = gamepad;
    
    socket.emit('action', {
        M1: motorAdapter(buttons[LEFT_HUMMER]),
        M2: motorAdapter(buttons[RIGHT_HUMMER]),
        LEFT: motorAdapter(buttons[LEFT_ARROW]),
        RIGHT: motorAdapter(buttons[RIGHT_ARROW]),
        TOP: motorAdapter(buttons[TOP_ARROW]),
        BOTTOM: motorAdapter(buttons[BOTTOM_ARROW]),
        AXES: axes,
    });

    rAF(updateLoop);
}

window.addEventListener('gamepadconnected', updateLoop);