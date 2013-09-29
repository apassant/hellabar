// Bootstrap offcanvas
$(document).ready(function() {
  $('[data-toggle=offcanvas]').click(function() {
    $('.row-offcanvas').toggleClass('active');
  });
});

// Angular App
function AppCtrl($scope) {
  
    $scope.login = function() {
        var self = this;
        FB.login(function(response) {
            if (response.authResponse) {
                $scope.loading = 1;
                $scope.$$phase || $scope.$apply();
                // Get facebook links, extract artists, and run mapping with gracenote
                FB.api('/me/likes', function(data) {
                    $scope.genres = {};
                    self.getArtists(data, function() {
                        self.loadMap();
                    });
                });
            }
        }, {scope: 'user_likes'});
    };
    
    $scope.getArtists = function(data, callback) {
        // Parse data
        $.each(data['data'], function(index, value) {
            // Get only artists
            if(value['category'] == 'Musician/band') {
                // Filter and get metadata through GraceNote API
                var name = value['name']
                var query = name.split(' ').join('+');
                var url = "https://mtl.gracenote.com/rest-ws/artist/search?q=name:" + query + "&format=jsonp&field=all&callback=?&APIKEY=hellahack2013";
                $.getJSON(url, function(data) {
                    if(data['response'][0]['score'] > 0.9) {
                        $scope.artists.push(data['response'][0]);
                        $scope.$$phase || $scope.$apply();
                    }
                })
            }
        });
        // Paginate or return callback
        var url = data['paging']['next'];
        if(url) {
            var self = this;
            $.get(url, function(data) {
                return self.getArtists(data, callback);
            });
        } else {
            return callback();
        }
    };
    
    $scope.loadMap = function() {
        // Need to get data from here to add points
        var mapOptions = {
            center: new google.maps.LatLng(37.8044, -122.2708),
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        // Get data from venues
        $.get('./assets/venues.json', function(data) {
            $scope.venues = data;
            // Display once it's loaded
            $scope.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
            $scope.$$phase || $scope.$apply();
        })
        
    };
    
    $scope.clearVenues = function() {
        if($scope.markers) {
            $.each($scope.markers, function(index, value) {
                value.setMap(null);
            })
        }
        $scope.markers = [];
    };
    
    $scope.showVenues = function(venues) {
        if(!venues) return;
        var self = this;
        $.each(venues, function(index, value) {
            // Get venue from list
            var venue = $scope.venues[value];
            // Put on map
            var myLatlng = new google.maps.LatLng(venue.geolocation[0], venue.geolocation[1]);
            var marker = new google.maps.Marker({
                position: myLatlng,
                map: $scope.map,
                title: venue.name
            });
            $scope.markers.push(marker);
            // Setup infowindow data + trigged
            google.maps.event.addListener(marker,"click", function() {
                // Close existing infoWindow
                if ($scope.infowindow) {
                    $scope.infowindow.close();
                }
                // Create content
                var link = '<a href="' + venue.url + '" target="_blank">';
                var content = '<p>'+ link + venue.name + '</a> is playing ' + venue.genres.join(', ') + '.</p>';
                if(venue.image) {
                    content = link + '<img class="pic" src="' + venue.image + '"></a>' + content;
                }
                content = '<div class="infoWindow">' + content + '<br/><img src="' + venue.ratings_image + '"/></div>';
                $scope.infowindow = new google.maps.InfoWindow({
                    content: content,
                    maxWidth: 320
                });
                // Display infoWindow
                $scope.infowindow.open($scope.map, marker);
            });
        })
    };
    
    $scope.loadVenues = function(artist) {
        // Activate link
        $.each($scope.artist, function(index, value) {
            value.active = false;
        })
        artist.active = true;
        // Get venues from JSON - remove all other first
        this.clearVenues();
        var self = this;
        $.get('./assets/genres.json', function(data) {
            self.showVenues(data[artist.metadata.genre1]);
            self.showVenues(data[artist.metadata.genre2]);
        })
    }
}


