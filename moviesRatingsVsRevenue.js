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

(function moviesRatingsVsRevenue() {
    "use strict";
    
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
        axis.axisScale = d3.scaleLinear().range(axis.axisRange);
        axis.pointsScale = d3.scaleLinear().range(axis.pointsRange);
        axis.map = movie => axis.pointsScale(axis.value(movie));
        axis.axis = d3["axis" + axis.orientation.capitalize()]().scale(axis.axisScale);
        axis.transform = "translate(" + margins.left + "," + axis.yTranslate + ")";
    };
    
    const axes = {
        x: {
            name: "rating",
            officialName: "Rating",
            axisRange: [0, size.width],
            pointsRange: [margins.left, size.width + margins.right],
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
            axisRange: [size.height, 0],
            pointsRange: [size.height, 0],
            orientation: "left",
            yTranslate: 0,
            textAttrs: {
                x: 0,
                y: size.height / 2,
                // dy: ".71em",
            },
        },
    };
    Object.values(axes).forEach(initAxis);
    window.axes = axes;
    
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
    tooltip.fade = function(duration, newOpacity) {
        tooltip.transition()
            .duration(duration)
            .styles({opacity: newOpacity});
    };
    
    const preProcessMovies = function(movies) {
        return movies
            .map(movie => ({
                rawMovies: movie,
                name: movie.title,
                rating: parseFloat(movie.vote_average),
                numRatings: parseInt(movie.vote_count),
                revenue: parseInt(movie.revenue),
            }))
            .filter(movie => movie.numRatings >= 15);
    };
    
    const setupAxis = function(xy, axis, movies) {
        const pointsDomain = [d3.min(movies, axis.value), d3.max(movies, axis.value)];
        const axisDomain = [pointsDomain[0], pointsDomain[1] * 10 / 9.5];
        console.log(xy, pointsDomain, axisDomain, axis);
        axis.axisScale.domain(axisDomain);
        axis.pointsScale.domain(pointsDomain);
        
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
    };
    
    const setupAxes = function(movies) {
        Object.entries(axes).forEach(entry => {
            const [xy, axis] = entry;
            setupAxis(xy, axis, movies);
        });
        return movies;
    };
    
    const showMovieInfo = function(movie) {
        tooltip.fade(200, 0.9);
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
    };
    
    const plotMovies = function(movies) {
        svg.selectAll(".dot")
            .data(movies)
            .enter()
            .append("circle")
            .attrs({
                class: "dot",
                r: 3.5,
                cx: axes.x.map,
                cy: axes.y.map,
            })
            .styles({fill: "black"})
            .on("mouseover", showMovieInfo)
            .on("mouseout", tooltip.fade.bind(tooltip, 500, 0.9));
    };
    
    const addTitle = function() {
        const title = body.append("center");
        title.append("h2")
            .text(document.title);
        title.node().remove();
        body.node().prepend(title.node());
    };
    
    const citeSource = function() {
        body.append("p")
            .html("Source: <a href=" + dataUrl + ">" + dataUrl + "</a>");
    };
    
    d3.csv("movies.csv", {mode: "same-origin"})
        .then(movies => movies.slice(0, /*10*/movies.length))
        .then(preProcessMovies)
        .then(movies => window.movies = movies)
        .then(setupAxes)
        .then(plotMovies);
    
    addTitle();
    citeSource();
    
})();