// Closes the sidebar menu
$("#menu-close").click(function(e) {
    e.preventDefault();
    $("#sidebar-wrapper").toggleClass("active");
});

// Opens the sidebar menu
$("#menu-toggle").click(function(e) {
    e.preventDefault();
    $("#sidebar-wrapper").toggleClass("active");
});

// Scrolls to the selected menu item on the page
$(function() {
    $('a[href*=#]:not([href=#])').click(function() {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') || location.hostname == this.hostname) {

            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
            if (target.length) {
                $('html,body').animate({
                    scrollTop: target.offset().top
                }, 1000);
                return false;
            }
        }
    });
});

// updates market values int the market section
$("#market").ready( function () {
    var market_ticker = "https://api.bitcoinaverage.com/ticker/USD/";
    $.getJSON( market_ticker, function (market_data) {
        $("#average").html("1 " + "<i class=\"fa fa-bitcoin fa-1x\"></i> = " + market_data["24h_avg"] + "(USD)");
        $("#ask-bid").html( market_data["ask"] + " (USD) / " + market_data["bid"] + " (USD)");
        $("#yesterday").html( market_data["last"] + " (USD)");
        $("#volume").html( market_data[ "total_vol" ] + " <i class=\"fa fa-bitcoin fa-1x\"></i>");
    });
});