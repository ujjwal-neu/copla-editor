import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dygraph from '../dygraphs/dygraph';
import * as utils from '../dygraphs/dygraph-utils';


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

  getOptions = (markerData, annotationData) => {
    const { channel, dateWindow, height, minRange, maxRange } = this.props;
    // console.log('anno data: ',this.props.annotationData)
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

        function highlight_period(x_color, x_start, x_end,label) {
          var bottom_left = g.toDomCoords(x_start);
          let x_end_updated = (Number(x_end)+2).toString();
          var top_right = g.toDomCoords(x_end_updated);
  
          var left = bottom_left[0];
          var right = top_right[0];
          
          canvas.fillStyle = x_color;
          canvas.fillRect(left, area.y, right - left, area.h);
          canvas.textAlign = "center";
          canvas.fillStyle = "black";
          canvas.font=("15px Arial")
          
          if(channel.index === 8)
          canvas.fillText(label, (left+right)/2, 100);         
         
        }
        
        markerData.map(marker => highlight_period(marker[2], marker[0], marker[0], marker[1]))
        annotationData.map(annotate => highlight_period(annotate[3], annotate[0], annotate[1], annotate[2]))
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
    const options = this.getOptions(this.props.markerData, this.props.annotationData);
    const value = [dateWindow[0], [channel.physicalMinimum, 0, channel.physicalMaximum]];
    const graph = new Dygraph(this.container, [value], options);
    // console.log(graph)
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

  drawZoomRect_(direction, startX, endX, startY, endY, prevDirection, prevEndX, prevEndY) {
    const ctx = this.canvas_ctx_;
    console.log(startX)
    // Clean up from the previous rect if necessary
    if (prevDirection === utils.HORIZONTAL) {
      ctx.clearRect(Math.min(startX, prevEndX), this.layout_.getPlotArea().y,
        Math.abs(startX - prevEndX), this.layout_.getPlotArea().h);
    }
    else if (prevDirection === utils.VERTICAL) {
      ctx.clearRect(this.layout_.getPlotArea().x, Math.min(startY, prevEndY),
        this.layout_.getPlotArea().w, Math.abs(startY - prevEndY));
    }
    console.log(startX, endX)
    // Draw a light-grey rectangle to show the new viewing area
    if (direction === utils.HORIZONTAL) {
      if (endX && startX) {
        
        ctx.fillStyle = 'rgba(128,128,128,0.33)';
        ctx.fillRect(Math.min(startX, endX), this.layout_.getPlotArea().y,
          Math.abs(endX - startX), this.layout_.getPlotArea().h);
      }
    }
    else if (direction === utils.VERTICAL) {
      if (endY && startY) {
        ctx.fillStyle = 'rgba(128,128,128,0.33)';
        ctx.fillRect(this.layout_.getPlotArea().x, Math.min(startY, endY),
          this.layout_.getPlotArea().w, Math.abs(endY - startY));
      }
    }
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

    return <div ref={ref} style={style} />;
  }

}
