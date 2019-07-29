import { Component, Input, ViewChild, ElementRef, SimpleChanges } from '@angular/core';
import { XYData } from '@shared/models/xydata.model';
import * as d3 from "d3";

@Component({
  selector: 'xygraph',
  templateUrl: './xygraph.component.html',
  styleUrls: ['./xygraph.component.scss']
})
export class XygraphComponent {
  @Input() 
  x: Float64Array;

  @Input() 
  y: Float64Array;

  @Input() 
  yData: Float64Array;

  @ViewChild('chart', { static: true })
  chartContainer: ElementRef;

  xymodel: XYData[];
  xydata: XYData[];

  figure: d3.Selection<SVGGElement, unknown, null, undefined>;
  chartProps: any;

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
        this.xydata.push({
          x: this.x[i],
          y: this.yData[i]
        })
      }
    }
  }

  buildChart() {
    this.parseInputToXYData();
    this.chartProps = {};
    let element = this.chartContainer.nativeElement;
    // let margin = { top: 30, right: 20, bottom: 30, left: 50 };
    this.chartProps.margin = { top: 30, right: 20, bottom: 50, left: 50 };
    this.chartProps.width = element.offsetWidth - this.chartProps.margin.left - this.chartProps.margin.right;
    this.chartProps.height = element.offsetHeight - this.chartProps.margin.top - this.chartProps.margin.bottom;
    
    this.figure = d3.select(element)
    .append("svg")
    .attr('width', element.offsetWidth)
    .attr('height', element.offsetHeight)
    .append("g")
    .attr("transform", "translate(" + this.chartProps.margin.left + ", " + this.chartProps.margin.top + ")");
   
    // Set the ranges
    this.chartProps.xscale = d3.scaleLinear()
    .domain(d3.extent(this.x))
    .range([0, this.chartProps.width]);
    
    this.chartProps.yscale = d3.scaleLinear()
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
  
    this.figure.selectAll(".dot")
    .data(this.xydata)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => this.chartProps.xscale(d.x))
    .attr("cy", (d) => this.chartProps.yscale(d.y))
    .attr("r", 3)
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
    this.figure.select('.line') // update the line
    .datum(this.xymodel)
    .attr('d', this.chartProps.line)

    this.figure.select('.x.axis') // update x axis
    .call(this.chartProps.xAxis);

    this.figure.select('.y.axis') // update y axis
    .call(this.chartProps.yAxis);

    this.figure.selectAll("circle") // remove old dots
    .remove();

    this.figure.selectAll(".dot") // add new dots
    .data(this.xydata)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => this.chartProps.xscale(d.x))
    .attr("cy", (d) => this.chartProps.yscale(d.y))
    .attr("r", 3);
  }
}