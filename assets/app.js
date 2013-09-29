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
                    var artist = data['response'][0];
                    // Only correctly identified artists
                    if(artist['score'] > 0.9) {
                        // Add to the genre dictionary
                        var skip = new Array();
//                        $.each(new Array('genre1', 'genre2'), function(index, value) {
                        var genre = String(artist.metadata.genre1);
                        if(genre) {
                            // First time, get venues and skip genre if nothing found
                            if($scope.genres[genre] == undefined && skip.indexOf(genre) == -1) {
                                $.get('./assets/genres.json', function(data) {
                                    venues = data[genre];
                                    if(venues) {
                                        $scope.genres[genre] = {
                                            'name' : genre.toLowerCase().replace(/\b[a-z]/g, function(letter) {
                                                return letter.toUpperCase();
                                            }),
                                            'active' : false,
                                            'artists' : new Array(artist),
                                            'venues' : venues
                                        };
                                    } else {
                                        skip.push(genre);
                                    }
                                });
                            } else {
                                $scope.genres[genre]['artists'].push(artist)
                            }
                        }
//                        });
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
                var content = '<p>'+ link + venue.name + '</a> plays ' + venue.genres.join(', ') + '.</p>';
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
    
    $scope.loadVenues = function(genre, data) {
        // Activate link
        $.each($scope.genres, function(index, value) {
            value.active = false;
        })
        data.active = true;
        // Show venues
        this.clearVenues();
        this.showVenues(data['venues']);
        $scope.genre = data['name'];
        $scope.artists = $.map(data['artists'], function(value, index) {
            return value['metadata']['name']
        }).join(', ');
    }
}


