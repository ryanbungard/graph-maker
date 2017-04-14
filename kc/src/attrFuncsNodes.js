function nodeSizeDefault(d) {
  var lengthRad = defaultRadius + Math.log(d.paperID.length) * 50;
  return lengthRad
  // return lengthRad < 30 ? 30 : lengthRad;
}

function nodeInit(selection) {
  selection
    .attr("class", "dataNodes")
    .attr('id', function (d) { return 'id' + d.id; })
    .style('opacity', function (d, i) {
      return 0;
      // console.log(_.isEqual(window.activations.nodeIDs[i], d.id), 'ids match')
      // // d => d.paperID.length >= 3 ? .7 : 0)
      // if (d.type == "paper") {
      //   return 0;
      // } else {
      //   // authors are always visible to start with
      //   if (d.type == "author") {
      //     return 0.7;
      //     // } else if (d.paperID.length >= 3) {
      //     // } else if (d.paperID.length >= 3 || d.distance_from_root_min == 0) {
      //   } else if (d.distance_from_root_min == 0) {
      //     return 0.7
      //   } else {
      //     return 0;
      //   }
      // }
    })
    .style("fill", function (d) {
      if (d.type == 'author')
        return 'red';
      else if (d.type == 'paper')
        return '#00BFFF';
      else {
        return '#247';
      }
    })
    .attr("width", (d, i) => {
      return bbox_array[i][1][0] * 2
    }) ////from center: [[topLeftX, topLeftY(- is up)], [bottomRightX, bottomRightY(+ is down)]]
    .attr("height", (d, i) => {
      return bbox_array[i][1][1] * 2;
    })
    .attr('ry', '5')
    .on("contextmenu", function (d, i) {
      var hasClass = d3.select(this).classed('leftClicked');
      d3.select(this).classed('leftClicked', false);
      var hasClass = d3.select(this).classed('rightClicked');
      d3.select(this).classed('rightClicked', !hasClass);

      d3.event.preventDefault();
      if (_.includes(window.dblClickedIDs, d.id)) {
        _.remove(window.dblClickedIDs, (n) => n === d.id)
      } else {
        window.dblClickedIDs.push(d.id)
      }
      handleClick(selection, d, i)
    })
    .on("click", function (d, i) {
      d3.select('.leftClicked').classed('leftClicked', false);
      d3.select(this).classed('leftClicked', true);
      handleClick(selection, d, i)
    })
    .on("mouseover", function (d) { // for tooltips
      //  if (d3.select(this).style('opacity') < 1) {
      div.transition()
        .duration(200)
        .style("opacity", .9);
      div.html(d.name)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
      //  }
    })
    .on("mouseout", function (d) {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    })
}

function nodesSelected(selection) {
  console.log('node selection', selection)
  selection
    .transition()
    .duration(toggleTime)
    // .attr('r', d => nodeSizeDefault(d))
    .style('opacity', 1)

  //     .attr("r", function (d) { //click radius change
  //     if (d.type == 'paper') {
  //         return topicRadius;
  //     } else {
  //         return 2 + defaultRadius + Math.log(d.paperID.length) * 10;
  //     }
  // })
  // .attr('---', (d, i) => {
  //     //unfix these nodes so the are re-simulated
  //     d.fx = null;
  //     d.fy = null;
  // })
}

function nodeReset(selection, purpose) {
  selection
    .transition()
    .duration(toggleTime)
    // .style('opacity', d => d.paperID.length >= 3 ? .4 : 0)
    .style('opacity', function (d) {
      // d => d.paperID.length >= 3 ? .7 : 0)
      if (purpose == "reset") {
        if (d.type == "paper") {
          return 0;
        } else {
          // authors are always visible to start with
          if (d.type == "author") {
            return 0.7;
          } else if (d.distance_from_root_min == 0) {
            return 0.7
          } else {
            return 0;
          }
        }
      } else {
        if (d.type == "paper") {
          return 0;
        } else {
          if (d.paperID.length >= 3 || d.distance_from_root_min == 0) {
            return 0.2
          } else {
            return 0;
          }
        }
      }

    })
    .style('stroke', 'none')


  // function(d) {
  //   if (purpose === "transition") {
  //     if (d.type === "paper") {
  //       return 0;
  //     } else {
  //       return 0.1;
  //     }
  //   } else {
  //     if (d.paperID.length >= 2) {
  //       return 0.5+d.paperID.length/10;
  //     } else if (d.type === "paper") {
  //       return 0;
  //     } else {
  //       return 0.25;
  //     }
  //   }
  // }

  // .attr('r', d => nodeSizeDefault(d))
  // .attr("r", function(d){
  //    if(d.type=='action' || d.type=='why-hard')
  //    return defaultRadius+Math.log(d.paperID.length)*10;
  //    if(d.type=='paper')
  //        return topicRadius;
  // })
}

function handleClick(selection, d, i) {
  const scaleFunc = (ix) => {return (jStat.log([1 + aggActivations[ix]]))};
  // grab all the query nodes; add the clicked node to the query node list
  var allClickIDs = _.uniq(_.concat(window.dblClickedIDs, d.id));
  // retrieve the relevant activation vectors for each query node
  // store in an array of arrays
  var arr = allClickIDs.map((cur, i) => window.activations[cur]);
  // turn the M*N array of arrays into an array of rows,
  // where each row is a M-length vector of activations for a single node
  // across the M queries
  var zippedArr = _.zip.apply(_, arr);
  // aggregates across the query activation vectors for each node
  // dump into a single N-length array with the aggregated activations for each node
  var aggActivations = zippedArr.map(row => jStat(row).geomean())
    window.links.style('opacity', function (link, k) {
        var nodesMean = jStat([aggActivations[link.nodeIxs[0]],aggActivations[link.nodeIxs[1]]]).mean();
        return nodesMean < .2 ? .2 : nodesMean * 1.5; //links are mean of source/target opacity
    }).style('stroke-width', function (link, k) {
        var nodesMean = jStat([aggActivations[link.nodeIxs[0]],aggActivations[link.nodeIxs[1]]]).mean();
        return nodesMean < .2 ? "1px" : "2px"; //links are mean of source/target opacity
    })


  // loop over all the nodes
  selection.style('opacity', function (node, ix) {
    if (_.includes(window.dblClickedIDs, node.id)) {
      return 1;
    } else {
      return thisActivation = scaleFunc(ix);
    }
  })
  window.textSelection.style('opacity', function (label, ix) {
    // console.log(_.isEqual(window.activations.nodeIDs[ix], data.id), 'ids match')
    // console.log(window.activations[d.id], d.id, ix)
    // return window.activations[d.id][ix]
    //  var opacity = jStat.log([1 + aggActivations[ix] * 1.5]);
    //  if (opacity < .5) {
    //     d3.select(this).style('fill', 'black').style('opacity', opacity + .5)
    //   } else {
    //     d3.select(this).style('fill', 'white').style('opacity', opacity + .5)
    //   }
    if (_.includes(window.dblClickedIDs, label.id) || label.type === 'author' || label.distance_from_root_min == 0) {
      return 1;
    } else {
      return scaleFunc(ix);
    }
    if (label.type === 'author') d3.select(this).style('fill', 'darkgrey')
  })

}
