function generate_qrcode() {
    var text = "https://adenchenan.github.io/js_function_plotting/func_image.html?y=";
    for (var i = 0; i < all_graph.length; ++i) {
        text += all_graph[i][2] + ";";
    }
    qrcode.makeCode(text);
}

