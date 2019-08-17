import { Component, Input, ViewChild, ElementRef, SimpleChanges } from '@angular/core';
import { XYData } from '@shared/models/xydata.model';
import { XYEData } from '@shared/models/xyedata.model';

import * as d3 from "d3";

@Component({
  selector: 'logxlogygraph',
  templateUrl: './logxlogygraph.component.html',
  styleUrls: ['./logxlogygraph.component.scss']
})
export class LogXLogYGraphComponent {
  @Input() 
  x: Float64Array;

  @Input() 
  y: Float64Array;

  @Input() 
  yData: Float64Array;

  @Input() 
  syData: Float64Array;

  @Input() 
  xlabel: string;
  
  @Input() 
  ylabel: string;

  @ViewChild('chart', { static: true })
  chartContainer: ElementRef;

  xymodel: XYData[];
  xydata: XYEData[];

  figure: d3.Selection<SVGGElement, unknown, null, undefined>;
  chartProps: any;

  resizeId;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.chartProps) {
      this.updateChart();
    } else {
      this.buildChart();
    }
    
  }

  parseInputToXYData() {
    this.xymodel = [];
    this.xydata = [];
    if (this.y.length > 0) {
      for (let i=0; i<this.x.length; i++) {
        this.xymodel.push({
          x: this.x[i],
          y: this.y[i]
        })
      }
    }

    if (this.yData.length > 0) {
      for (let i=0; i<this.x.length; i++) {
        let point: XYEData = {
          x: this.x[i],
          y: this.yData[i],
          sy: 0
        };
        if (this.syData.length > 0 ) {
          point.sy = this.syData[i];
        }
        this.xydata.push(point);
      }
    }
    
  }

  buildChart() {
    this.parseInputToXYData();
    this.chartProps = {
      capsize: 5
    };
    let element = this.chartContainer.nativeElement;
    // let margin = { top: 30, right: 20, bottom: 30, left: 50 };
    this.chartProps.margin = { top: 30, right: 20, bottom: 60, left: 60 };
    this.chartProps.width = element.offsetWidth - this.chartProps.margin.left - this.chartProps.margin.right;
    this.chartProps.height = element.offsetHeight - this.chartProps.margin.top - this.chartProps.margin.bottom;
    
    this.figure = d3.select(element)
    .append("svg")
    .attr('width', element.offsetWidth)
    .attr('height', element.offsetHeight)
    .append("g")
    .attr("transform", "translate(" + this.chartProps.margin.left + ", " + this.chartProps.margin.top + ")");
    
    // xlabel
    this.figure.append("text")             
    .attr("transform",
          "translate(" + (this.chartProps.width/2) + " ," + 
                        (this.chartProps.height + this.chartProps.margin.top + 20) + ")")
    .style("text-anchor", "middle")
    .text(this.xlabel);

    // ylabel
    this.figure.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - this.chartProps.margin.left)
    .attr("x",0 - (this.chartProps.height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text(this.ylabel);  

    // Set the ranges
    this.chartProps.xscale = d3.scaleLog()
    .domain(d3.extent(this.x))
    .range([0, this.chartProps.width]);
    
    this.chartProps.yscale = d3.scaleLog()
    .domain(d3.extent(this.y))
    .range([this.chartProps.height, 0]);

    this.chartProps.line = d3.line<XYData>()
      .x(d => this.chartProps.xscale(d.x))
      .y(d => this.chartProps.yscale(d.y))
      .curve(d3.curveMonotoneX);
    
    this.chartProps.xAxis = d3.axisBottom(this.chartProps.xscale).ticks(5);
    this.chartProps.yAxis = d3.axisLeft(this.chartProps.yscale).ticks(5);
  
    this.figure.append('path')
    .datum(this.xymodel)
    .attr('d', this.chartProps.line)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('class', 'line')
    
    this.figure.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${this.chartProps.height})`)
    .call(this.chartProps.xAxis);
    
    this.figure.append('g')
    .attr('class', 'y axis')
    .call(this.chartProps.yAxis);
  }

  refreshChartSize() {
    if (this.chartProps) {
      d3.selectAll("svg") // remove old plot
      .remove();

      this.buildChart(); // rebuild axis
      this.updateChart(); // plot data
    }
  }

  updateChart() {
    this.parseInputToXYData();
    this.chartProps.xscale
    .domain(d3.extent(this.x))
    
    if (this.yData.length > 0) {
      this.chartProps.yscale
      .domain(d3.extent(this.yData))
    } else {
      this.chartProps.yscale
      .domain(d3.extent(this.y))
    }

    this.figure.transition();
    
    this.figure.select('.x.axis') // update x axis
    .call(this.chartProps.xAxis);

    this.figure.select('.y.axis') // update y axis
    .call(this.chartProps.yAxis);

    this.figure.selectAll("circle") // remove old dots
    .remove();

    this.figure.selectAll("line") // remove old lines
    .remove();
    this.figure.selectAll('path') // update the line
    .remove();

    this.figure.selectAll(".dot") // add new dots
    .data(this.xydata)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => this.chartProps.xscale(d.x))
    .attr("cy", (d) => this.chartProps.yscale(d.y))
    .attr("r", 3)
    .attr("fill","red");

    if (this.syData.length > 0) {
      this.figure.selectAll(".line_up") // upper errorbar line
      .data(this.xydata)
      .enter().append("line")
      .style("stroke", "red")
      .attr("x1", (d) => this.chartProps.xscale(d.x)-this.chartProps.capsize)
      .attr("x2", (d) => this.chartProps.xscale(d.x)+this.chartProps.capsize)
      .attr("y1", (d) => this.chartProps.yscale(d.y+d.sy))
      .attr("y2", (d) => this.chartProps.yscale(d.y+d.sy));
  
      this.figure.selectAll(".line_down") // lower errorbar line
      .data(this.xydata)
      .enter().append("line")
      .style("stroke", "red")
      .attr("x1", (d) => this.chartProps.xscale(d.x)-this.chartProps.capsize)
      .attr("x2", (d) => this.chartProps.xscale(d.x)+this.chartProps.capsize)
      .attr("y1", (d) => this.chartProps.yscale(d.y-d.sy))
      .attr("y2", (d) => this.chartProps.yscale(d.y-d.sy));
  
      this.figure.selectAll(".line_vertical") // vertical errorbar line
      .data(this.xydata)
      .enter().append("line")
      .style("stroke", "red")
      .attr("x1", (d) => this.chartProps.xscale(d.x))
      .attr("x2", (d) => this.chartProps.xscale(d.x))
      .attr("y1", (d) => this.chartProps.yscale(d.y-d.sy))
      .attr("y2", (d) => this.chartProps.yscale(d.y+d.sy));
    }

    this.figure.append('path')
    .datum(this.xymodel)
    .attr('d', this.chartProps.line)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('class', 'line')
  }

  onResize(event) {
    clearTimeout(this.resizeId);
    this.resizeId = setTimeout(this.windowResizedDone.bind(this), 500);
  }

  windowResizedDone() {
    this.refreshChartSize();
  }
}
