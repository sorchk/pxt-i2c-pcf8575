/**
 * PCF8575
 */
//% weight=100 color=#0f00ff icon=""
namespace PCF8575 {

    const MIN_CHIP_ADDRESS = 0x20
    /**
     * 读取数据
     */
    //% block="读取针脚 %u 的数据"
    export function read(pin: number): number {
        pins.i2cWriteNumber(MIN_CHIP_ADDRESS, pin, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(MIN_CHIP_ADDRESS, NumberFormat.Int8LE);
    } 
    /**
    * 写入数据
    * @param 针脚 pin
    * @param 数据 value
    */
    //% blockId=sonar_ping block="向针脚针脚 %pin|写入数据 %value"
    export function write(pin: number, value: number): void {
        const buffer = pins.createBuffer(2)
        buffer[0] = pin
        buffer[1] = value
        pins.i2cWriteBuffer(MIN_CHIP_ADDRESS, buffer, false)
    }

}
