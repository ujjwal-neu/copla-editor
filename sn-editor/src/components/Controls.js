import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Controls extends Component {

  static propTypes = {
    proxy: PropTypes.object.isRequired,
  }

  handleClicks = async (ev) => {
    this.props.proxy.onClick(ev.target.dataset);
  }

  render() {
    const Button = ({ children, action, seconds, value }) => (
      <button
        className="btn btn-default btn-ghost"
        onClick={this.handleClicks}
        data-action={action}
        data-seconds={seconds}
        data-value={value}
      >{children}</button>
    );

    return (
      <div className="controls site-nav btn-group m-l-1">
        <h5>Time: </h5>
        <Button action="moveLeft">←</Button>
        <Button action="moveRight">→</Button>
        <Button action="play">▶</Button>
        <Button action="time" seconds="3">3s</Button>
        <Button action="time" seconds="5">5s</Button>
        <Button action="time" seconds="7">7s</Button>
        <Button action="time" seconds="10">10s</Button>
        <Button action="time" seconds="full">full</Button>
        <Button action="saveAnnotation">Save Annotation</Button>
        <h5>Scale: </h5>
        <Button action="setRange" value="100">100</Button>
        <Button action="setRange" value="150">150</Button>
        <Button action="setRange" value="auto">auto</Button>
      </div>
    );
  }

}
