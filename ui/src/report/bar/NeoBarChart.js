import React from "react";
import NeoReport from "../NeoReport";
import * as d3 from "d3";

class NeoBarChart extends NeoReport {

    componentDidUpdate(prevProps) {
        super.componentDidUpdate(prevProps);
        this.componentDidMount();
    }

    componentDidMount() {
        let data = this.state.data;
        let page = this.state.page;
        let props = this.props;
        let id = props.id;
        let parsedParameters = props.params;

        d3.select(".chart" + id).select('g').remove()
        if (!data || data.length === 0) {
            return
        }
        let prop1 = props.propertiesSelected[0];
        let prop2 = props.propertiesSelected[1];
        let index1 = prop1 ? Object.keys(data[0]).indexOf(prop1) : 0;
        let index2 = prop2 ? Object.keys(data[0]).indexOf(prop2) : 1;


        data = data.map((row, i) => {
            return [this.parseChartValue(Object.values(row)[index1], 0, i),
                this.parseChartValue(Object.values(row)[index2], 1, i)]
        })

        let labels = {}
        if (data.length > 0) {
            Object.keys(this.state.data[0]).forEach(
                i => labels[i] = i
            )
            props.onNodeLabelUpdate(labels);
        }

        // Set size
        let {maxY, minY, xTextLength} = this.getDataLimits(data);
        let digits = Math.log10(Math.abs(maxY));
        var xShift = ((digits > 1) ? digits * 7 + 18 : Math.abs(digits) * 7 + 32);
        xShift += (maxY < 0 || minY < 0) ? 10 : 0;
        var yShift = 20 + xTextLength * 4;
        var width = -90 + props.width * 105 - xShift * 0.5, height = -140 + props.height * 100 - yShift;
        var margin = {top: 0, right: 0, bottom: yShift, left: xShift};

        var svg = d3.select(".chart" + id)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");


        var x = d3.scaleBand()
            .range([0, width])
            .domain(data.map(function (d) {
                return d[0];
            }))
            .padding(0.2);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        var y = d3.scaleLinear()
            .domain([minY - (maxY - minY) * 0.1, maxY + (maxY - minY) * 0.1])
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));


        svg.selectAll("mybar")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", function (d) {
                return x(d[0]);
            })
            .attr("y", function (d) {
                if (isNaN(d[1])) {
                    return 0
                }
                return y(d[1]);
            })
            .attr("width", x.bandwidth())
            .attr("height", function (d) {
                if (isNaN(d[1])) {
                    return 0
                }
                return height - y(d[1]);
            })
            .attr("fill", function (d) {

                let color = (parsedParameters && parsedParameters.color) ? (parsedParameters.color) : "#69b3a2";
                return (d[1]) ? color : "transparent";
            })
            .on("mousemove", function (d) {
                let prop1 = (props.propertiesSelected[0]) ? props.propertiesSelected[0] : Object.keys(labels)[0];
                let prop2 = (props.propertiesSelected[1]) ? props.propertiesSelected[1] : Object.keys(labels)[1];
                d3.select(".chart-tooltip")
                    .style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY - 80 + "px")
                    .style("display", "inline-block")
                    .html(prop1 + ": " + d[0] + "<br>" + prop2 + ": " + d[1]);
            })
            .on("mouseout", function (d) {
                d3.select(".chart-tooltip").style("display", "none")
            });

    }

    getDataLimits(data) {
        let yValues = data.map(row => row[1]);
        let categoryLengths = data.map(row => (row[0] ? row[0] : "").toString().length);
        let maxY = Math.max.apply(Math, yValues.filter(y => y !== null && !isNaN(y)));
        let minY = Math.min.apply(Math, yValues.filter(y => y !== null && !isNaN(y)));
        let maxX = Math.max.apply(Math, categoryLengths);
        if (minY === maxY) {
            minY = minY - 1;
            maxY = maxY + 1;
        }
        if (!isFinite(maxY) || !isFinite((minY))) {
            maxY = 1;
            minY = 0;
        }
        // to prevent -infinity for maxY = 0
        if (maxY === 0) {
            maxY = 0.1;
        }
        maxX = Math.min.apply(Math, [maxX, 30])
        return {maxY, minY, xTextLength: maxX};
    }

    parseChartValue(value, index, i) {
        // If there's no data, fill it with some blanks.
        if (value === null) {
            if (index === 0) {
                return 'null [' + i + ']'
            } else {
                return NaN
            }
        }

        // if it's a number, just return it.
        if (!isNaN(value)) {
            return value
        }
        // if we are dealing with the y axis, and it's not a number, we obviously want to cancel.
        if (index === 1) {
            return NaN
        }
        if (typeof (value) === "object" && !isNaN(value["low"])) {
            return value.low
        }

        if (typeof (value) === "string") {
            return value;
        }

        if (value && value["labels"] && value["identity"] && value["properties"]) {
            return value.labels + "(" + value.identity + ")"
        }
        if (value && value["type"] && value["start"] && value["end"] && value["identity"] && value["properties"]) {
            return value.type + "(" + value.identity + ")"
        }
        return (value) ? value.toString() : "";
    }

    render() {
        let rendered = super.render();
        if (rendered) {
            return rendered;
        }
        return <svg
            className={'chart chart' + this.props.id + ' iteration' + this.props.page + " isRunning" + this.state.running}>
        </svg>
    }

}

export default (NeoBarChart);
