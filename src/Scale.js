import React, { Component } from "react";
import "./Scale.css";
class Scale extends Component {
  constructor(props) {
    super(props);

    this.USB_FILTERS = [
      { vendorId: 0x7b7c, productId: 0x0100 }, // 30kg scale Elane UParcel
      { vendorId: 0x0922, productId: 0x8003 }, // 10lb scale Dymo M10
      { vendorId: 0x0922, productId: 0x8004 }, // 25lb scale Dymo M25
      { vendorId: 0x0922, productId: 0x8009 }, // 250lb scale Mettler S250
      { vendorId: 0x1446, productId: 0x6A73 }, // 5lb scale Stamps.com 510
      { vendorId: 0x1446, productId: 0x6A75 }, // 25lb scale Stamps.com 2510
      { vendorId: 0x1446, productId: 0x6A78 }, // 75lb scale Dymo Endicia
      { vendorId: 0x0B67, productId: 0x555E }, // Fairbanks SCB-R9000-14
      { vendorId: 0x0EB8, productId: 0xF000 } // Mettler PS60
    ];

    this.UNIT_MODES = { 2: "g", 3: "kg", 11: "oz", 12: "lb" };
    this.SCALE_STATES = { 2: "±", 4: "+", 5: "-" };

    this.state = {
      connected: false,
      device: null,
      shouldRead: null,
      weight: "?",
      unit: "",
      scaleState: "",
      errorMsg: null
    };

    if (navigator.usb) {
      navigator.usb.getDevices({ filters: this.USB_FILTERS }).then(devices => {
        devices.forEach(device => {
          this.bindDevice(device);
        });
      });

      navigator.usb.addEventListener("connect", e => {
        console.log("device connected", e);
        this.bindDevice(e.device);
      });

      navigator.usb.addEventListener("disconnect", e => {
        console.log("device lost", e);
        this.disconnect();
      });

      this.connect = () => {
        navigator.usb
          .requestDevice({ filters: this.USB_FILTERS })
          .then(device => this.bindDevice(device))
          .catch(error => {
            console.error(error);
            this.disconnect();
          });
      };
    }

    this.getWeight = this.getWeight.bind(this);
    this.stopWeight = this.stopWeight.bind(this);
    this.bindDevice = this.bindDevice.bind(this);
    this.disconnect = this.disconnect.bind(this);
  }

  getWeight() {
    this.setState({ shouldRead: true });
    const { device } = this.state;
    const { endpointNumber, packetSize } = device.configuration.interfaces[
      0
    ].alternate.endpoints[0];
    let readLoop = () => {
      device
        .transferIn(endpointNumber, packetSize)
        .then(result => {
          let data = new Uint8Array(result.data.buffer);

          let weight = data[4] + 256 * data[5];

          const unit = this.UNIT_MODES[data[2]];

          if (unit === "oz" || unit === "lb") {
            // Use Math.pow to avoid floating point math.
            weight /= Math.pow(10, 1);
          } else if (unit === "kg") {
            weight /= 10
          }

          const scaleState = this.SCALE_STATES[data[1]];

          this.setState({
            weight: weight,
            unit: unit,
            scaleState: scaleState
          });

          if (this.state.shouldRead) {
            readLoop();
          }
        })
        .catch(err => {
          console.error("USB Read Error", err);
        });
    };
    readLoop();
  }

  stopWeight() {
    this.setState({ shouldRead: false });
  }

  bindDevice(device) {
    device
      .open()
      .then(() => {
        console.log(
          `Connected ${device.productName} ${device.manufacturerName}`,
          device
        );
        this.setState({ connected: true, device: device });

        if (device.configuration === null) {
          return device.selectConfiguration(1);
        }
      })
      .then(() => device.claimInterface(0))
      .then(() => this.getWeight())
      .catch(err => {
        console.error("USB Error", err);
        this.setState({ errorMsg: err.message });
      });
  }

  disconnect() {
    this.setState({
      connected: false,
      device: null,
      shouldRead: null,
      weight: "?",
      unit: "",
      scaleState: "",
      errorMsg: ""
    });
  }

  render() {
    const {
      device,
      connected,
      shouldRead,
      weight,
      unit,
      scaleState,
      errorMsg
    } = this.state;

    return (
      <main>
        <h1>
          Scale {connected ? "Online" : "Offline"}
        </h1>

        {!navigator.usb &&
          <p>
            Please enable chrome://flags/#enable-experimental-web-platform-features
          </p>}

        {errorMsg &&
          <p>
            {errorMsg}
          </p>}

        {connected &&
          !shouldRead &&
          <button onClick={this.getWeight}>▶</button>}

        {shouldRead && <button onClick={this.stopWeight}>⏸</button>}

        {!device && <button onClick={this.connect}>Register Device</button>}

        {connected &&
          <span className="scale">
            <small>{scaleState}</small>
            {weight}
            <small>{unit}</small>
          </span>
        }
      </main>
    );
  }
}

export default Scale;
