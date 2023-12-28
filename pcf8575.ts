/**
 * PCF8575
 */
//% weight=100 color=#0f00ff icon=""
namespace PCF8575 {
    const CHIP_ADDRESS = 0x20
    //翻转引脚 1-7 10-17 翻转后 7-1 17-10
    let pinOverturn = 0

    export enum PinValue {
        //% block="高1"
        H = 0x1,
        //% block="低0"
        L = 0x0
    }
    export enum PinIndex {
        P0 = 0x00,
        P1 = 0x01,
        P2 = 0x02,
        P3 = 0x03,
        P4 = 0x04,
        P5 = 0x05,
        P6 = 0x06,
        P7 = 0x07,

        P10 = 0x08,
        P11 = 0x09,
        P12 = 0x0a,
        P13 = 0x0b,
        P14 = 0x0c,
        P15 = 0x0d,
        P16 = 0x0e,
        P17 = 0x0f
    }
    /**
        * 设置针脚电平
        * 参数 针脚 pin
        * 参数 电位 value
        */
    //% pin.min=0 pin.max=256
    //% value.min=-9999 value.max=9999
    //% blockId=setPinValue block="设置针脚 %pin|的电平为 %value"
    export function setPinValue(pin: PinIndex, value: PinValue): void {
        const currentState = getValue();
        if (pinOverturn == 1) {
            //翻转引脚
            if (pin > 7) {
                pin = 15 - pin + 8;
            } else {
                pin = 7 - pin;
            }
        }
        const bit = 1 << 15 - pin;
        const newState = value == 1 ? (currentState | bit) : (currentState & (~bit & 0xffff));
        setValue(newState);
    }
    /**
     * 读取针脚电位
     */
    //% blockId=readPinValue block="读取针脚 %u 的电平"
    export function getPinValue(pin: PinIndex): PinValue {
        const currentState = getValue();
        const value = currentState & 1 << 15 - pin;
        return value == 0 ? PinValue.L : PinValue.H;
    }
    /**
    * 翻转引脚 1-7 10-17 翻转后 7-1 17-10
    */
    //% blockId=setPinOverturn block="翻转引脚"
    export function setPinOverturn(): void {
        pinOverturn = 1;
    }
    /**
    * 复位
    */
    //% blockId=reset block="复位"
    export function reset(): void {
        setValue(0);
    }
    /**
     * 电位
     */
    //% blockId=pinValue block="电平 %u"
    export function pinValue(value: PinValue): PinValue {
        return value;
    }
    function setValue(value: number) {
        const buffer2 = pins.createBuffer(2);
        buffer2[0] = (value >> 8) & 0xff;
        buffer2[1] = value & 0xff;
        pins.i2cWriteBuffer(CHIP_ADDRESS, buffer2, false);
    }
    function getValue() {
        const buffer = pins.i2cReadBuffer(CHIP_ADDRESS, 2, false);
        return buffer[0] << 8 | buffer[1];
    }




    /**
    * 超声波测距 取平均值，当有效采样次数达到5次及以上时，去掉最高和最低取平均
    * @param trig 针脚
    * @param echo 针脚
    * @param nofs 采样数 (无论是否达到有效数最大采样20次)
    * @param maxMmDistance 最大距离 默认450cm
    */
    //% nofs.min=3 nofs.max=20
    //% blockId=sonar block="trig针脚 %trig|echo针脚 %echo|滤波次数 %unit"
    export function sonar(trig: PinIndex, echo: PinIndex, nofs: number, maxCmDistance = 450): number {
        const results = [];
        //最大采样次数
        const max = 20;
        for (let i = 0; i < max; i++) {
            if (results.length >= nofs) {
                //达到设置采样数
                break;
            }
            //数据采样
            const result = sonarOnce(trig, echo, maxCmDistance * 10);
            if (result > 0) {
                //有效采样
                results.push(result);
            }
            //采样间隔
            control.waitMicros(100);
        }
        const len = results.length;
        let count = 0;
        if (len == 0) {
            //无有效采样
            return 0;
        } else if (len == 1) {
            //只有一个有效采样
            return results[0];
        } else if (len > 4) {
            //有效采样是5个及以上
            //去掉最大和最小 取平均值
            for (let i = 1; i < len - 1; i++) {
                count += results[i];
            }
            return count / (len - 2)
        } else {
            //取平均值
            for (let i = 0; i < len; i++) {
                count += results[i];
            }
            return count / len;
        }
    }
    //声音速度343.2米/秒  声纳需要来回也就是171.6米/秒 171.6毫米/毫米 0.1716毫米/纳秒 
    //声纳的速度 0.1716mm/us
    const sonarSpeed = 0.1716;
    function sonarOnce(trig: PinIndex, echo: PinIndex, maxMmDistance = 4500) {
        // send pulse 
        setPinValue(trig, PinValue.L)
        control.waitMicros(2);
        setPinValue(trig, PinValue.H);
        control.waitMicros(12);
        setPinValue(trig, PinValue.L);
        //超时时间us
        const timeout = maxMmDistance / sonarSpeed;
        let readTime = 0;
        let waitTime = 0;
        const start = input.runningTimeMicros();
        //等待脉冲到来
        while (getPinValue(echo) == PinValue.L) {
            //等待
            if (waitTime > timeout) {
                return 0;
            }
            waitTime = input.runningTimeMicros() - start;
        }
        const readStart = input.runningTimeMicros();
        //等待脉冲结束 给脉冲计时
        while (getPinValue(echo) == PinValue.H) {
            if (readTime > timeout) {
                return 0;
            }
            readTime = input.runningTimeMicros() - readStart;
        }
        //读取脉冲完成
        const mm = readTime * sonarSpeed;
        return mm;
    }
}