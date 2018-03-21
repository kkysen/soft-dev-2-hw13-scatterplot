Object.defineProperties(Object, {
    
    defineSharedProperties: {
        writable: false,
        enumerable: false,
        configurable: false,
        value(obj, sharedDescriptor, propertyValues) {
            const properties = {};
            for (const value in propertyValues) {
                if (propertyValues.hasOwnProperty(value)) {
                    properties[value] = Object.assign({value: propertyValues[value]}, sharedDescriptor);
                }
            }
            Object.defineProperties(obj, properties);
        },
    },
    
});

Object.defineSharedProperties(Object.prototype, {
    writable: false,
    enumerable: false,
    configurable: false,
}, {
    
    freeze() {
        return Object.freeze(this);
    },
    
    seal() {
        return Object.seal(this);
    },
    
    _clone() {
        return Object.assign({}, this);
    },
    
});

Object.defineSharedProperties(String.prototype, {
    writable: false,
    enumerable: false,
    configurable: false,
}, {
    
    capitalize() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    },
    
});

(function scatterPlot() {
    
    const dataUrl = "https://www.kaggle.com/rounakbanik/the-movies-dataset/downloads/movies_metadata.csv/7";
    
    const absSize = {
        width: window.innerWidth * .9,
        height: window.innerHeight * .9,
    };
    const margins = {
        top: 20,
        bottom: 20 * 2,
        left: 40 * 2,
        right: 20,
    };
    const size = {
        width: absSize.width - margins.left - margins.right,
        height: absSize.height - margins.top - margins.bottom,
    };
    
    const initAxis = function(axis) {
        axis.value = movie => movie[axis.name];
        axis.scale = d3.scaleLinear().range(axis.range);
        axis.map = movie => axis.scale(axis.value(movie));
        axis.axis = d3["axis" + axis.orientation.capitalize()]().scale(axis.scale);
        axis.transform = "translate(" + margins.left + "," + axis.yTranslate + ")";
    };
    
    const axes = {
        x: {
            name: "rating",
            officialName: "Rating",
            range: [0, size.width],
            orientation: "bottom",
            yTranslate: size.height,
            textAttrs: {
                x: size.width / 2,
                y: size.height + margins.bottom - 5,
            },
        },
        y: {
            name: "revenue",
            officialName: "Revenue",
            range: [size.height, 0],
            orientation: "left",
            yTranslate: 0,
            textAttrs: {
                x: 0,
                y: size.height / 2,
                // dy: ".71em",
            },
        },
    };
    window.axes = axes;
    Object.values(axes).forEach(initAxis);
    
    const body = d3.select(document.body);
    
    const svg = body
        .append("svg")
        .attrs(absSize)
        .append("g")
        .attrs({
            transform: "translate(" + margins.left + "," + margins.top + ")",
        });
    
    const tooltip = body
        .append("div")
        .classed("tooltip", true)
        .style("opacity", 0);
    
    d3.csv("movies.csv")
        .then(rawMovies => {
            
            // TODO uncomment for testing so not so many movies
            // rawMovies.splice(10);
            
            const movies = rawMovies
                .map(movie => ({
                    rawMovies: movie,
                    name: movie.title,
                    rating: parseFloat(movie.vote_average),
                    numRatings: parseInt(movie.vote_count),
                    revenue: parseInt(movie.revenue),
                }))
                .filter(movie => movie.numRatings >= 15);
            window.movies = movies;
            
            Object.entries(axes).forEach(entry => {
                const [xy, axis] = entry;
                axis.scale.domain([d3.min(movies, axis.value), d3.max(movies, axis.value)]);
                
                svg.append("g")
                    .attrs({
                        class: xy + " axis",
                        transform: axis.transform,
                    })
                    .call(axis.axis);
                
                svg.append("text")
                    .attrs(Object.assign({class: "label"}, axis.textAttrs))
                    .styles({"text-anchor": "end"})
                    .text(axis.officialName);
            });
            
            svg.selectAll(".dot")
                .data(movies)
                .enter()
                .append("circle")
                .attrs(movie => ({
                    class: "dot",
                    r: 3.5,
                    cx: axes.x.map(movie),
                    cy: axes.y.map(movie),
                }))
                .styles({fill: "black"})
                .on("mouseover", movie => {
                    tooltip.transition()
                        .duration(200)
                        .styles({opacity: 0.9});
                    const html = Object.entries({
                            Movie: movie.name,
                            Rating: movie.rating,
                            Revenue: movie.revenue,
                            "Number of Ratings": movie.numRatings,
                        })
                        .map(entries => entries.join(": "))
                        .join("<br>");
                    tooltip.html(html)
                        .styles({
                            left: (d3.event.pageX + 5) + "px",
                            top: (d3.event.pageY - 28) + "px",
                        });
                })
                .on("mouseout", () => {
                    tooltip.transition()
                        .duration(500)
                        .styles({opacity: 0});
                });
        });
    
})();