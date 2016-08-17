(function ($) {
    var shade = "red";
    $.fn.greenify = function() {
        this.css( 'color', shade);
        this.list = function(){
        	console.log('list');
        }
        return this;
    };
}(jQuery));