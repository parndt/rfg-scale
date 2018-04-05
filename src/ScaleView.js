import React, { Component } from "react";
import Scale from "./scale";
import "./Scale.css";

class ScaleView extends Scale {
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

export default ScaleView;
