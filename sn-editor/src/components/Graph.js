import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dygraph from '../dygraphs/dygraph';

const typeMap = {
  H: 'Hypopnoe',
  Z: 'Zentral Apnoe',
  G: 'Gemischte Apnoe',
  O: 'Obstruktive Apnoe',
};

export default class Graph extends Component {

  static propTypes = {
    channel: PropTypes.object.isRequired,
    frequency: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.array,
    artifacts: PropTypes.array,
    dateWindow: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    minRange: PropTypes.number,
    maxRange: PropTypes.number,
    markerData:PropTypes.array,
    annotationData:PropTypes.array
  }

  static defaultProps = {
    height: 60,
    data: null,
    frequency: 1,
    artifacts: null,
  }


  minHeight = 60

  componentDidMount() {
    if (this.container) this.createGraph();
    console.log('markerData from graph component',this.props.markerData)
    console.log('annotation from graph component',this.props.annotationData)
  }

  componentDidUpdate(prevProps) {
    if (!this.graph) return;
 

    if (this.props.dateWindow !== prevProps.dateWindow) {
      this.graph.dateWindow_ = this.props.dateWindow;
      this.redrawGraph();
    }

    if (this.props.data !== prevProps.data || this.props.frequency !== prevProps.frequency) {
      this.renderGraph();
      this.redrawGraph();
    }

    if((this.props.minRange!== prevProps.minRange) || (this.props.maxRange!== prevProps.maxRange)) {
      this.createGraph();
    }
  }

  componentWillUnmount() {
    if (this.graph) {
      this.observer.unobserve(this.container);
      this.observer = null;
      this.graph.destroy();
      this.graph = null;
    }
  }

  getOptions = () => {
    const { channel, dateWindow, height, minRange, maxRange } = this.props;
    console.log('anno data: ',this.props.annotationData)
    return {
      dateWindow,
      // TODO toggle dynamic range / physical range ???
      height: Math.max(height, this.minHeight),
      valueRange: [
        // channel.physicalMinimum - 1, // -1 and +1 so the graph doesn't touch the border and y-labels are correctly drawn
        // channel.physicalMaximum + 1,
        minRange, maxRange
      ],
      axes: {
        x: {
          drawGrid: false, // show toggle in ui
          drawAxis: false, // i === header.numberOfSignals - 1,
        },
        y: {
          drawGrid: false,
          // drawAxis: false,
        },
      },
      // timingName: `${`${i}`.padStart(2, ' ')} ${header.labels[i].padStart(12, ' ')}`, // log rendering time for debugging
      // connectSeparatedPoints: false // lücken sind ein fehler, der nicht versteckt werden sollte
      // title: header.labels[i], // breaks layout, so we use our own
      strokeWidth: 1.0,
      // rollPeriod: 1, // TODO an "Signaldichte" ausrichten

      errorBars: true, // TODO only when frequency is set
      customBars: true, // TODO only when frequency is set

      showRoller: false, // hides roller input field
      drawPoints: false,
      highlightCircleSize: 2,
      // labelsDiv: this.labelDiv, // TODO
      labels: ['Time', 'Value'],
      ylabel: channel.physicalDimension, // einheit

      interactionModel: {
        wheel: this.handleScrollX,
      },

      legendFormatter: this.legendFormatter,

      // TODO highlightCallback', 'unhighlightCallback' => punkte synchronisieren?

      // zoomCallback() { /* disable (set `valueRange` to initial value) or show reset button */ },
      // disable via: Dygraph.prototype.doZoomY_ = (lowY, highY) => null;

      underlayCallback: function(canvas, area, g) {

        function highlight_period(x_color, x_start, x_end) {
          var bottom_left = g.toDomCoords(x_start);
          var top_right = g.toDomCoords(x_end);
  
          var left = bottom_left[0];
          var right = top_right[0];
  
          canvas.fillStyle = x_color;
          canvas.fillRect(left, area.y, right - left, area.h);
        }
        

        highlight_period("blue", 1661757775556.7, 1661757775557.7);
        highlight_period("red", 1661757775845.36, 1661757775846.36);
        highlight_period("black", 1661757776520.62, 1661757776521.62);
      }

  
    };
  }

  updateOptions = (options) => {
    if (!this.graph) return;
    this.graph.updateOptions(options);
    this.renderGraph();
    this.redrawGraph();
  }

  createGraph = () => {
    const { channel, dateWindow } = this.props;
    const options = this.getOptions();
    const value = [dateWindow[0], [channel.physicalMinimum, 0, channel.physicalMaximum]];
    const graph = new Dygraph(this.container, [value], options);
    // graph.setAnnotations([
    //   {
    //     series: channel.standardLabel,
    //     x: "1661757775520.62",
    //     shortText: "L",
    //     text: "Good/Bad",
    //     tickHeight: 10
    //   }
    //   ]);
    //   console.log("Highlighted", graph.getHighlightSeries());
    //   console.log("Label", graph.getLabels());
    graph.name = channel.label;
    graph.draw = graph.drawGraph_.bind(graph);
    graph.cascadeEvents_('clearChart');
    graph.elementsCache = {};

    this.graph = graph;
    this.attachObserver(graph, this.container);
    this.addPlotbands(graph, this.props.artifacts);
    const span = document.createElement('span');
    span.className = 'graph-label';
    span.innerText = channel.label;
    this.container.append(span);
  }

  addPlotbands(graph, artifacts) {
    if (!artifacts) return;
    artifacts.forEach(({ type, starttime, endtime }) => {
      console.log(type, starttime, endtime);
      if (type in typeMap) type = typeMap[type];
      graph.addBand({
        start: starttime,
        end: endtime,
        note: type,
        isEditable: true,
      });
    });
  }

  legendFormatter = (data) => {
    if (!data.series || !data.series[0]) return;
    return (data.series[0].y || 0).toFixed(2);
  }

  handleScrollX = (event) => {
    if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) return;

    event.preventDefault();

    const delta = (-event.wheelDeltaX || event.deltaX) * (100 / this.props.frequency);
    const [windowLeft, windowRight] = this.props.dateWindow;

    this.props.onChange(windowLeft + delta, windowRight + delta);
  }

  attachObserver = (graph, container) => {
    const callback = (entries) => {
      const isVisible = entries[0].isIntersecting;

      if (isVisible && this.props.data) {
        this.renderGraph();
        this.redrawGraph();
      }

      this.setState({ isVisible });
    };
    this.observer = new IntersectionObserver(callback, { threshold: 0 });
    this.observer.observe(container);
  }

  redrawGraph = () => {
    if (this.graph) this.graph.draw();
  }

  renderGraph = () => {
    if (!this.graph || !this.props.data) return;
    this.graph.rolledSeries_[1] = this.props.data;
    this.graph.renderGraph_();
  }

  render() {
    const ref = el => this.container = el;
    const style = { width: '100%' };

    // console.log(this.graph);
    return <div ref={ref} style={style} />;
  }

}
