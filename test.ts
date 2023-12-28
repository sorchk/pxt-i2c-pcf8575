// 在此处测试；当此软件包作为插件使用时，将不会编译此软件包。
const MICROBIT_MAKERBIT_ULTRASONIC_CLAP_ID = 3475;

/**
 * Do something when a clap or finger snap is detected.
 * @param trig pin connected to trig, eg: DigitalPin.P5
 * @param echo pin connected to echo, eg: DigitalPin.P8
 * @param handler body code to run when event is raised
 */
//% subcategory="Ultrasonic"
//% blockId=makerbit_ultrasonic_on_clap
//% block="on clap detected | with HC-SR04 Trig at %trig | and Echo at %echo"
//% trig.fieldEditor="gridpicker"
//% trig.fieldOptions.columns=4
//% trig.fieldOptions.tooltips="false"
//% echo.fieldEditor="gridpicker"
//% echo.fieldOptions.columns=4
//% echo.fieldOptions.tooltips="false"
//% weight=49
function onClap(
    trig: DigitalPin,
    echo: DigitalPin,
    handler: () => void
) {
    initClapDetection(trig, echo);

    control.onEvent(
        MICROBIT_MAKERBIT_ULTRASONIC_CLAP_ID,
        EventBusValue.MICROBIT_EVT_ANY,
        () => {
            handler();
        }
    );
}

function initClapDetection(trig: DigitalPin, echo: DigitalPin) {
    let nextTrigger = 0;
    let noTriggerInALongTimeTrigger = 0;

    control.inBackground(() => {
        while (true) {
            basic.pause(20);
            const now = input.runningTime();
            if (
                (nextTrigger != 0 && now > nextTrigger) ||
                now > noTriggerInALongTimeTrigger
            ) {
                //TODO triggerPulse(trig);
                nextTrigger = 0;
                noTriggerInALongTimeTrigger = now + 2000;
            }
        }
    });

    let adjustmentTimeframe = 0;
    let hcsr04Timeout = 30000;

    pins.onPulsed(echo, PulseValue.High, () => {
        const pulseDuration = pins.pulseDuration();
        const now = input.runningTime();

        // Adjust device timeout duration
        if (hcsr04Timeout === 30000) {
            // no timeout received - probably because of ultrasonic noise
            adjustmentTimeframe = now + 3000;
        }
        if (pulseDuration > hcsr04Timeout && now < adjustmentTimeframe) {
            hcsr04Timeout = pulseDuration;
        }

        if (pulseDuration > hcsr04Timeout - (hcsr04Timeout >> 4)) {
            const n = now + 30;
            if (n > nextTrigger) {
                nextTrigger = n;
            }
        } else if (pulseDuration > 0) {
            control.raiseEvent(MICROBIT_MAKERBIT_ULTRASONIC_CLAP_ID, 1);
            // prevent double detection of same clap/snap
            const n = now + 500;
            if (n > nextTrigger) {
                nextTrigger = n;
            }
        }
    });
}