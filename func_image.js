var win_width,
    win_height,
    // init at get_page_size()
    axis_max_height,
    axis_max_width,
    // init at adjust_size()
    default_enlarge_val      = 30,
    default_graph_width      = 2,
    default_axis_width       = 3,
    default_guide_line_width = 1,
    default_font_size        = 27,
    default_axis_mark_size   = 20,
    rect_size                = 20,
    // size of rect to show color of graph
    
    color_using_index        = 0,
    graph_color              = ["#770000", "#007700", "#000077", "#777700", "#007777", "#770077"]
    // color for graph (change automatically)
    all_graph                = [];
    // all_graph = [
    //     [expression1_in_format, color1, expression1], 
    //     [expression2_in_format, color2, expression2], 
    //     etc.
    // ]

var graph               = document.getElementById("graph"),
    y_val_input_box     = document.getElementById("y_val"),
    guide_line_checkbox = document.getElementById("guide_line_checkbox"),
    axis_checkbox       = document.getElementById("axis_checkbox"),
    axis_mark_checkbox  = document.getElementById("axis_mark_checkbox"),
    other_info_label    = document.getElementById("other_info"),
    err_msg_label       = document.getElementById("err_msg"),
    color_selector      = document.getElementById("color"),
    input_area          = document.getElementById("input_area"),
    context             = graph.getContext("2d");

var backing_store_ratio = context.webkitBackingStorePixelRatio ||
                        context.mozBackingStorePixelRatio ||
                        context.msBackingStorePixelRatio ||
                        context.oBackingStorePixelRatio ||
                        context.backingStorePixelRatio || 1,
    device_pixel_ratio = window.devicePixelRatio || 1;

var ratio = device_pixel_ratio / backing_store_ratio;


function get_page_size() {
    // get size of pag
    if (window.innerWidth) {
        win_width = window.innerWidth;
    } else if ((document.body) && (document.body.clientWidth)) {
        win_width = document.body.clientWidth;
    }
    if (window.innerHeight) {
        win_height = window.innerHeight;
    } else if ((document.body) && (document.body.clientHeight)) {
        win_height = document.body.clientHeight;
    }
    if (document.documentElement && document.documentElement.clientHeight &&
        document.documentElement.clientWidth) {
        win_height = document.documentElement.clientHeight;
        win_width = document.documentElement.clientWidth;
    }
}


function int_line_to(x, y) {
    // round x, y and pass them to context.lineTo
    context.lineTo(Math.round(x), Math.round(y));
}


function int_move_to(x, y) {
    // round x, y and pass them to context.moveTo
    context.moveTo(Math.round(x), Math.round(y));
}


function draw_axis() {
    // draw axis on context
    // origin == middle of context
    context.beginPath();
    int_move_to(-axis_max_width + 0.5, 0);
    int_line_to(axis_max_width + 0.5, 0);
    int_move_to(0, -axis_max_height + 0.5);
    int_line_to(0, axis_max_height + 0.5);

    context.lineWidth = default_axis_width;
    context.strokeStyle = "#000";
    context.stroke();
}


function draw_axis_mark(gap_size) {
    context.font = default_axis_mark_size + "px arial,sans-serif";
    context.fillStyle = "#000000";
    var pos;
    var x = -Math.round(axis_max_width/gap_size)*gap_size;
    for (; x <= axis_max_width; x += gap_size) {
        pos = (x/default_enlarge_val).toFixed(2);
        if (pos == -0) {
            pos = 0;
        }
        context.fillText(String(pos), x + 5, default_axis_mark_size);
    }
    var y = -Math.round(axis_max_height/gap_size)*gap_size;
    for (; y <= axis_max_height; y += gap_size) {
        pos = (-y/default_enlarge_val).toFixed(2);
        if (pos != 0) {
            context.fillText(String(pos), 5, y + default_axis_mark_size);
        }
    }
}


function draw_guide_line(gap_size) {
    var x = -Math.round(axis_max_width/gap_size)*gap_size;
    for (; x <= axis_max_width; x += gap_size) {
        int_move_to(x, -axis_max_height);
        int_line_to(x, axis_max_height);
    }

    var y = -Math.round(axis_max_height/gap_size)*gap_size;
    for (; y <= axis_max_height; y += gap_size) {
        int_move_to(-axis_max_width, y);
        int_line_to(axis_max_width, y);
    }
    context.lineWidth = default_guide_line_width;
    context.strokeStyle = "#000";
    context.stroke();
}


function get_guide_line_gap_size() {
    var gap = axis_max_width / 5 / default_enlarge_val;
    var digit_num = Math.ceil(Math.log(gap) / Math.log(10));
    var base = 10**(digit_num - 2)
    gap = Math.round(gap / base);
    // left with 2 digit
    if (gap % 10 <= 5) {
        gap += 5 - gap % 10;
    } else {
        gap += 10 - gap % 10;
    }
    // last digit round to 0 or 5
    return gap*base*default_enlarge_val;
}


function format_expression(expression) {
    // format expression(val of y)
    return expression
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/\^/g, "**")
        .replace(/\[/g, "(")
        .replace(/\]/g, ")")
        .replace(/\{/g, "(")
        .replace(/\}/g, ")")
        .replace(/-?[0-9]+\.?[0-9]*([A-Za-z]+|\()/g,
            function(sub_expression) {
                for (var i = 0; i < sub_expression.length; ++i) {
                    if ("a" <= sub_expression[i] && sub_expression[i] <= "z") {
                        return sub_expression.substring(0, i) +
                            "*" + sub_expression.substring(i, sub_expression.length);
                    }
                }
            })
        // Math.constant
        .replace(/\be\b/g, "Math.E")
        .replace(/\bpi\b/g, "Math.PI")
        // Math.func
        .replace(/\babs\b/g, "Math.abs")
        .replace(/\bacos\b/g, "Math.acos")
        .replace(/\basin\b/g, "Math.asin")
        .replace(/\batan\b/g, "Math.atan")
        .replace(/\batan2\b/g, "Math.atan2")
        .replace(/\bceil\b/g, "Math.ceil")
        .replace(/\bcos\b/g, "Math.cos")
        .replace(/\bexp\b/g, "Math.exp")
        .replace(/\bfloor\b/g, "Math.floor")
        .replace(/\blog\b/g, "Math.log")
        .replace(/\bmax\b/g, "Math.max")
        .replace(/\bmin\b/g, "Math.min")
        .replace(/\bpow\b/g, "Math.pow")
        .replace(/\brandom\b/g, "Math.random")
        .replace(/\bround\b/g, "Math.round")
        .replace(/\bsin\b/g, "Math.sin")
        .replace(/\bsqrt\b/g, "Math.sqrt")
        .replace(/\btan\b/g, "Math.tan");
}


function show_graph_info(expression) {
    // checking exoeression fits ax^2+bx+c
    var reg_exp = ["", "[1-9][0-9]*\\*x\\*\\*2", "[1-9][0-9]*\\*x", "[1-9][0-9]*"];
    var arrangement = [
        // a b c != 0
        [1, 2, 3],
        [1, 3, 2],
        [2, 1, 3],
        [2, 3, 1],
        [3, 1, 2],
        [3, 2, 1],
        // (a b != 0) || (a c != 0)
        [1, 2],
        [1, 3],
        [2, 1],
        [3, 1],
        // a != 0
        [1]
    ];
    var final_reg_exp;
    for (var i = 0; i < arrangement.length; ++i) {
        // arrangement[i] => final_reg_exp
        final_reg_exp = "/^\\-?" + reg_exp[arrangement[i][0]];
        for (var j = 1; j < arrangement[i].length; ++j) {
            final_reg_exp += "[+-]" + reg_exp[arrangement[i][j]];
        }
        final_reg_exp += "$/";
        if (eval(final_reg_exp).test(expression)) {
            // match case
            var nums = [0].concat(expression.match(/\-?[1-9][0-9]*/g));
            nums.splice(arrangement[i].indexOf(1) + 2, 1);
            var a = nums[arrangement[i].indexOf(1) + 1],
                b = nums[arrangement[i].indexOf(2) + 1],
                c = nums[arrangement[i].indexOf(3) + 1];
            var delta = b * b - 4 * a * c;
            // output result
            other_info_label.innerText += "Δ = " + delta + "\n";
            if (delta < 0) {
                other_info_label.innerText += "此方程无实根";
            } else if (delta == 0) {
                other_info_label.innerText += "x1 = x2 = " + -b / (2 * a);
            } else {
                other_info_label.innerText +=
                    "x1 = " + ((-b + Math.sqrt(delta)) / (2 * a)).toFixed(2) + "\n" +
                    "x2 = " + ((-b - Math.sqrt(delta)) / (2 * a)).toFixed(2);
            }
            return;
        }// end of match case
    }
    // end of checking exoeression fits ax^2+bx+c
}


function new_graph(expression, color, enlarge) {
    // draw new graph on context
    // return true if success
    err_msg_label.innerText = "";
    other_info_label.innerText = "";
    var step = 0.5/default_enlarge_val;
    try {
        if (expression == "") {
            throw "expression empty";
        }
        show_graph_info(expression);
        context.beginPath();
        var x = -axis_max_width / enlarge + step;

        int_move_to(x * enlarge, -eval(expression) * enlarge);
        for (; x <= axis_max_width / enlarge; x += step) {
            int_line_to(x * enlarge, -eval(expression) * enlarge);
        }

        context.lineWidth = default_graph_width;
        context.strokeStyle = color;
        context.stroke();
    } catch (err) {
        err_msg_label.innerText = "函数不符合规范";
        console.log(err);
        return false;
    }
    return true;
}


function renew_graph() {
    reset_canvas();
    var text_x = -axis_max_width + default_font_size + rect_size,
        text_y = -axis_max_height + default_font_size,
        rect_x = -axis_max_width + default_font_size - rect_size/2,
        rect_y = -axis_max_height + rect_size/2;

    context.font = default_font_size + "px arial,sans-serif";
    for (var i in all_graph) {
        if (new_graph(all_graph[i][0], all_graph[i][1], default_enlarge_val)) {
            context.fillStyle = "#000000";
            context.fillText("y = " + all_graph[i][2], text_x, text_y);
            context.fillStyle = all_graph[i][1];
            context.fillRect(rect_x, rect_y, rect_size, rect_size);
            text_y += default_font_size;
            rect_y += default_font_size;
        } else {
            all_graph.splice(i, 1);
        }
    }
    document.getElementById("enlarge_val_input").value = (get_guide_line_gap_size()/default_enlarge_val).toFixed(2);
}


function add_new_graph() {
    if (y_val_input_box.value.length > 0) {
        all_graph.push([
            format_expression(y_val_input_box.value),
            color_selector.value,
            y_val_input_box.value
        ]);
    }
    for (var i = 0; i < all_graph.length - 1; ++i) {
        if (all_graph[i][0] == all_graph[all_graph.length - 1][0]) {
            // when new graph is same as graph that's drawn
            all_graph.splice(i, 1);
            break;
        }
    }
    color_using_index = (color_using_index + 1) % graph_color.length;
    color_selector.value = graph_color[color_using_index];
    renew_graph();
}


function adjust_size() {
    get_page_size();
    graph.style.height             = Math.round(win_height * 0.95) + "px";
    graph.style.width              = Math.round(win_width * 0.75) + "px";
    
    graph.height                   = Math.round(win_height * 0.95) * ratio;
    graph.width                    = Math.round(win_width * 0.75) * ratio;
    // 90% * 72%
    
    input_area.style.height        = Math.round(win_height * 0.95) - 10 + "px"; // -10: padding
    input_area.style.width         = Math.round(win_width * 0.2) + "px";
    // 90% * 20%
    
    axis_max_height                = Math.round(graph.height / 2);
    axis_max_width                 = Math.round(graph.width / 2);
}


function reset_canvas() {
    // clear canvas and redraw axis
    adjust_size();
    context.translate(0.5, 0.5);
    context.translate(axis_max_width, axis_max_height);
    if (axis_checkbox.checked) {
        draw_axis();
    }

    var guide_line_gap_size = get_guide_line_gap_size();
    if (guide_line_checkbox.checked) {
        draw_guide_line(guide_line_gap_size);
    }
    if (axis_mark_checkbox.checked) {
        draw_axis_mark(guide_line_gap_size);
    }
}


function clear_all() {
    reset_canvas();
    all_graph = [];
    other_info_label.innerText = "";
    err_msg_label.innerText = "";
    // y_val_input_box.value = "";
}


graph.addEventListener("mousemove", function(event) {
    var rect_pos = graph.getBoundingClientRect();
    var x = (event.clientX - rect_pos.left) * graph.width / rect_pos.width,
        y = (event.clientY - rect_pos.top) * graph.height / rect_pos.height;
    x -= axis_max_width;
    y = axis_max_height - y;
    x /= default_enlarge_val;
    y /= default_enlarge_val;
    document.getElementById("mouse_pos").innerText = "x: " + x.toFixed(2) + ", y:" + y.toFixed(2);
}, false);


y_val_input_box.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        // enter
        add_new_graph();
    }
}, false);


document.getElementById("enlarge_val_input").addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        // enter
        default_enlarge_val = 150/document.getElementById("enlarge_val_input").value;
        add_new_graph();
    }
}, false);


function mousewheel_handle(event) {
    if (event.deltaY <= 0) {
        default_enlarge_val *= 1.1;
    } else {
        default_enlarge_val /= 1.1;
    }
    renew_graph();
}


guide_line_checkbox.onchange = renew_graph;
axis_checkbox.onchange       = renew_graph;
axis_mark_checkbox.onchange  = renew_graph;
window.onresize              = renew_graph;
document.onresize            = renew_graph;
graph.onmousewheel           = mousewheel_handle;
add_new_graph();
