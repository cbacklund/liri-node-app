require("dotenv").config();
var Twitter = require('twitter');
var Spotify = require("node-spotify-api");
var keys = require("./keys.js");
var request = require("request");
var fs = require("fs");


var command1 = process.argv[2];

// code for handling the my-tweets command
if (command1 == "my-tweets") {
    tweetIt(); 
} else if (command1 == "spotify-this-song") {
    spotifyIt();
} else if (command1 == "movie-this") {
    movieIt();
} else if (command1 == "do-what-it-says") {
    doIt();
} else {
    console.log("Try Again! I didn't understand what you meant");
}

function tweetIt() {
    fs.appendFile(".log.txt", "Request: node liri.js my-tweets\n", (err) => {
        if (err) throw err;
    });
    
    var client = new Twitter(keys.twitter);
    var params = {screen_name: '@CraigB67956542', count: 20};

    client.get('statuses/user_timeline', params, function(error, tweets, response) {
        if (error) {
            var errorString = "Error getting tweets " + error;

            fs.appendFile("./log.txt", errorString, (err) => {
                if(error) throw err;
                console.log(errorString);
            });
            return;
        } else {
            var tweetString = "Recent Tweets:\n";

            for (var i = 0; i < tweets.length; i++) {
                tweetString += "Date: " + tweets[i].created_at +"\n"+  "Tweet: " + tweets[i].text + "\n\n";
            }

            fs.appendFile("./log.txt", "LIRI Says:\n" + tweetString + "\n", (err) => {
                if (err) throw err;
                console.log(tweetString);
            });
        }
    });

    function spotifyIt(song) {
        fs.appendFile("./log.txt", "Request: node liri.js spotify-this-song " + "\n", (err) => {
            if (err) throw err;
        });

        var spotify = new Spotify(keys.spotify);

        var songSearch = "";
        if (song === "") {
            search = "The Sign"; 
        } else {
            search = song;
        }

        spotify.search({ type: 'track', query: search}, function(error, data) {
            if (error) {
                var errorString1 = "Error getting songs" + error; 

                fs.appendFile("./log.txt", errorString1, (err) => {
                    if (err) throw err;
                    console.log(errorString1);
                });
                return; 
            } else {
                var songTracks = data.tracks.items[0];
                if (!songTracks) {
                    var errorString2 = "Error getting song info, maybe you have the wrong song name?";
                    
                    fs.appendFile("./log.txt", errorString2, (err) => {
                        if (err) throw err;
                        console.log(errorString2);
                    });
                } else {
                    var songString =    "Song Information:\n" +
                                        "Song Name: " + songTracks.name + "\n" +
                                        "Artist: " + songTracks.artists[0].name + "\n" +
                                        "Album: " + songTracks.album.name + "\n" + 
                                        "Preview Here: " + songTracks.preview_url + "\n";

                    fs.appendFile("./log.txt", "LIRI says:\n" + songString + "\n", (err) => {
                        if (err) throw err;
                        console.log(songString);
                    });
                }
            }
        })
    }


}

// retrieveOMDBInfo will retrieve information on a movie from the OMDB database
function movieIt(movie) {
	// Append the command to the log file
	fs.appendFile('./log.txt', 'User Command: node liri.js movie-this ' + movie + '\n\n', (err) => {
		if (err) throw err;
	});

	// If no movie is provided, LIRI defaults to 'Mr. Nobody'
	var search;
		if (movie === '') {
			search = 'Mr. Nobody';
		} else {
			search = movie;
		}

	// Replace spaces with '+' for the query string
	search = search.split(' ').join('+');

	// Construct the query string
	var queryStr = 'http://www.omdbapi.com/?t=' + search + '&plot=full&tomatoes=true';

	// Send the request to OMDB
	request(queryStr, function (error, response, body) {
		if ( error || (response.statusCode !== 200) ) {
			var errorStr1 = 'ERROR: Retrieving OMDB entry -- ' + error;

			// Append the error string to the log file
			fs.appendFile('./log.txt', errorStr1, (err) => {
				if (err) throw err;
				console.log(errorStr1);
			});
			return;
		} else {
			var data = JSON.parse(body);
			if (!data.Title && !data.Released && !data.imdbRating) {
				var errorStr2 = 'ERROR: No movie info retrieved, please check the spelling of the movie name!';

				// Append the error string to the log file
				fs.appendFile('./log.txt', errorStr2, (err) => {
					if (err) throw err;
					console.log(errorStr2);
				});
				return;
			} else {
		    	// Pretty print the movie information
		    	var outputStr = '------------------------\n' + 
								'Movie Information:\n' + 
								'------------------------\n\n' +
								'Movie Title: ' + data.Title + '\n' + 
								'Year Released: ' + data.Released + '\n' +
								'IMBD Rating: ' + data.imdbRating + '\n' +
								'Country Produced: ' + data.Country + '\n' +
								'Language: ' + data.Language + '\n' +
								'Plot: ' + data.Plot + '\n' +
								'Actors: ' + data.Actors + '\n' + 
								'Rotten Tomatoes Rating: ' + data.tomatoRating + '\n' +
								'Rotten Tomatoes URL: ' + data.tomatoURL + '\n';

				// Append the output to the log file
				fs.appendFile('./log.txt', 'LIRI Response:\n\n' + outputStr + '\n', (err) => {
					if (err) throw err;
					console.log(outputStr);
				});
			}
		}
	});
}

// doAsYerTold will read in a file to determine the desired command and then execute
function doIt() {
	// Append the command to the log file
	fs.appendFile('./log.txt', 'User Command: node liri.js do-what-it-says\n\n', (err) => {
		if (err) throw err;
	});

	// Read in the file containing the command
	fs.readFile('./random.txt', 'utf8', function (error, data) {
		if (error) {
			console.log('ERROR: Reading random.txt -- ' + error);
			return;
		} else {
			// Split out the command name and the parameter name
			var cmdString = data.split(',');
			var command = cmdString[0].trim();
			var param = cmdString[1].trim();

			switch(command) {
				case 'my-tweets':
					retrieveTweets(); 
					break;

				case 'spotify-this-song':
					spotifySong(param);
					break;

				case 'movie-this':
					retrieveOBDBInfo(param);
					break;
			}
		}
	});
}

// Determine which LIRI command is being requested by the user
if (liriCommand === 'my-tweets') {
	retrieveTweets(); 

} else if (liriCommand === `spotify-this-song`) {
	spotifySong(liriArg);

} else if (liriCommand === `movie-this`) {
	retrieveOBDBInfo(liriArg);

} else if (liriCommand ===  `do-what-it-says`) {
	doAsYerTold();

} else {
	// Append the command to the log file
	fs.appendFile('./log.txt', 'User Command: ' + cmdArgs + '\n\n', (err) => {
		if (err) throw err;

		// If the user types in a command that LIRI does not recognize, output the Usage menu 
		// which lists the available commands.
		outputStr = 'Usage:\n' + 
				   '    node liri.js my-tweets\n' + 
				   '    node liri.js spotify-this-song "<song_name>"\n' + 
				   '    node liri.js movie-this "<movie_name>"\n' + 
				   '    node liri.js do-what-it-says\n';

		// Append the output to the log file
		fs.appendFile('./log.txt', 'LIRI Response:\n\n' + outputStr + '\n', (err) => {
			if (err) throw err;
			console.log(outputStr);
		});
	});
}