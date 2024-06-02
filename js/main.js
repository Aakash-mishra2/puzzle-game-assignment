$(function () {
	FastClick.attach(document.body);
});

let positions = [];
let tiles = [];
let time = 0;
let timerStarted = false;
let moves = 0;
let counter = null;
let paused = true;
let optionsOpened = false;
let won = false;
let challenge = false;
let blankTile = {}
let blankTileIndex = -1;
let tileMap = new Map();
$(document).ready(function () {
	loadScores();
	loadChallenges();
	$('#shuffle-button').addClass('disabled');
	$('#help-button').addClass('disabled');
	$('#overlay-shuffle').hide();
	//Check game mode
	if (localStorage.getItem("challenge_code") != null) {
		$('#reset-button').addClass('disabled');
		$('#start-button').addClass('disabled');
		$('#game-mode').html('CHALLENGE MODE - CODE: <b>' + localStorage.getItem("challenge_code") + '</b>');
		loadChallengeInfo(localStorage.getItem("challenge_code"));
	}

	$("#grid").swipe({
		//Generic swipe handler for all directions
		swipe: function (event, direction, distance, duration, fingerCount) {
			if (!paused) {
				//console.log('swipe event', distance, duration, fingerCount);
				//console.log("You swiped " + direction);
				moveSwipedTile(direction);
			}
		},
		threshold: 20
	});
});

$(document).on('click', '.tile', function () {
	if (!paused) {
		var num = $(this).attr('num');
		var tile = getTile(num);
		tile.move();
		win();
	}
});

$(document).on('click', '#start-button', function () {
	if (!$(this).hasClass('disabled')) {
		if (paused) {
			startGame();
		} else {
			pauseGame();
		}
	} else {
		showBtnErrorMessage();
	}
});

$(document).on('click', '#reset-button', function () {
	if (!$(this).hasClass('disabled')) {
		resetGame();
	} else {
		showBtnErrorMessage();
	}
});

$(document).on('click', '#shuffle-button', function () {
	if (!$(this).hasClass('disabled')) {
		shuffleContents();
	} else {
		showBtnErrorMessage();
	}
});

$(document).on('click', '#overlay-play', function () {
	if (!$('#start-button').hasClass('disabled')) {
		startGame();
	} else {
		showBtnErrorMessage();
	}
});

$(document).on('click', '#overlay-paused', function () {
	startGame();
});
$(document).on('click', '#overlay-shuffle', function () {
	shuffleContents();
});

$(document).on('click', '#overlay-buttons #submit-button', function () {
	if ($(this).hasClass('enabled')) {
		$('#name-input-field').val('');
		$('#overlay-layer').fadeIn('fast');
		$('#name-input-box').fadeIn('fast');
	}
});

$(document).on('click', '#name-submit-button', function () {
	if ($('#name-input-field').val() != '') {
		insertScore($('#name-input-field').val());
		$('#overlay-layer').fadeOut('fast');
		$(this).parent().fadeOut('fast');
		$('#overlay-buttons #submit-button').removeClass('enabled');
		$('#overlay-buttons #submit-button').css('opacity', '0.5');
	}
});

$(document).on('click', '#name-cancel-button', function () {
	$('#overlay-layer').fadeOut('fast');
	$(this).parent().fadeOut('fast');
});

$(document).on('click', '#menu img', function () {
	if (!optionsOpened) {
		pauseGame();
		$('#overlay-play').hide();
		$('#overlay-paused').hide();
		$('#overlay-options').show();
		$(this).css('opacity', '0.8');
		optionsOpened = true;
	}
});

$(document).on('click', '#overlay-buttons #share-button', function () {
	window.open('https://www.facebook.com/sharer/sharer.php?u='
		+ encodeURIComponent(location.href),
		'facebook-share-dialog', 'width=626,height=436');
	return false;
});

function startGame() {
	paused = false;
	solveTile = 0;
	$('#start-button').html('PAUSE');
	$('#overlay').fadeOut('fast');
	$('#overlay-play').hide();
	$('#overlay-message').hide();
	$('#overlay-shuffle').hide();
	$('#overlay-submessage').hide();
	//$('#solvable-message').hide();
	$(this).css('opacity', '1');
	if (tiles.length == 0) {
		resetContents();
	}
	if ( timerStarted === false) {
		timerStarted = true;
		counter = setInterval(function () {
			time++;
			displayCurrentTime();
		}, 1000);
	}


	//console.log('all tiles are at start game', tiles);
	tiles.forEach((tile) => {
		tileMap.set(tile.current, tile.num);
	})
	$('#shuffle-button').removeClass('disabled');
	$('#help-button').removeClass('disabled');
	//console.log('tiles map is', tileMap)
}
function pauseGame() {
	paused = true;	
	$('#start-button').html('START');
	$('#overlay-paused').show();
	$('#overlay').fadeIn('fast');
	clearInterval(counter);
}
function pause_Shuffle() {
	paused = true;
	$('#start-button').html('START');
	$('#overlay-shuffle').show();
	$('#overlay').fadeIn('fast');
	clearInterval(counter);

}
function resetGame() {
	pauseGame();
	resetContents();
	$('#overlay-shuffle').hide();
	$('#overlay-paused').hide();
	$('#overlay-play').show();
	$('#overlay-message').hide();
	$('#overlay-submessage').hide();
	$('#overlay-buttons').hide();
}
function shuffleGame() {
	for (let i = tiles.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[tiles[i].x, tiles[j].x] = [tiles[j].x, tiles[i].x];
		[tiles[i].y, tiles[j].y] = [tiles[j].y, tiles[i].y];
		tiles[i].insertTile();
		tiles[j].insertTile();
	}
}
function findBlankTile() {
	const map1 = new Map();
	let set1 = new Set([...Array(16).keys()].map(x => x + 1));
	map1.set(1, 8);
	map1.set(2, 8);
	map1.set(3, 8);
	map1.set(4, 8);
	console.log('map is ', map1);

	tiles.forEach((tile) => {
		map1.set(tile.x, map1.get(tile.x) - 1);
		map1.set(tile.y, map1.get(tile.y) - 1);
		set1.delete(tile.current);
		if (map1.get(tile.x) == 0) { map1.delete(tile.x); }
		if (map1.get(tile.y) == 0) { map1.delete(tile.y); }
	});
	console.log('map final is', map1);
	const keysArr = [...map1.keys()];
	console.log(' keys', keysArr);
	blankTile = {
		x: keysArr[0],
		y: keysArr.length > 1 ? keysArr[1] : keysArr[0],
		index: set1.values().next().value
	}
}
function countInversions(arr) {
	let inversions = 0;
	const n = arr.length;
	for (let i = 0; i < n - 1; i++) {
		for (let j = i + 1; j < n; j++) {
			if (arr[i] && arr[j] && arr[i] > arr[j]) {
				inversions++;
			}
		}
	}
	return inversions;
}
function isSolvable() {
	const tilesSequence = tiles
		.sort((a, b) => a.current - b.current)
		.map(x => x.num);
	const inversions = countInversions(tilesSequence);
	const blankRowFromBottom = 4 - blankTile.y + 1;
	return ((inversions + blankRowFromBottom) % 2 === 1);
}
function shuffleContents() {
	shuffleGame();
	$('#label-text').html('');
	findBlankTile();
	let flag = isSolvable();
	if (flag == true) {
		setTimeout($('#label-text').html('This arrangement is not Solvable, Shuffle again !!'), 2000);
		pause_Shuffle();
		$('#help-button').addClass('disabled');
	}
	else {
		startGame();
		if( pause ){ 
			pause = false; 
			$('#overlay-shuffle').show();
		}
		$('#label-text').html('');
		$('#help-button').removeClass('disabled');
	}
}
function resetContents() {
	tiles = [];
	positions = loadPositions();
	generateTiles(positions);
	time = 0;
	moves = 0;
	$('#score-point .num').html('0');
	$('#timepoint .num').html('00:00');
	won = false;
}
let solveTile = 0;
function solveStep() {
	// let temp = tiles.map((tile) => {
	// 	set1.delete(tile.current);
	// 	return tile.current;
	// });
	// blankTileIndex = set1.values().next().value;

	// console.log('all tiles', tiles);
	//console.log('current postns', temp);
	//console.log('blankTile at', blankTileIndex);
	if (solveTile == 0) {
		findBlankTile();
		// swap blank tile
		let lastTile = tiles[tileMap.get(16) - 1];
		//console.log('tiles are ', tiles);
		//console.log('blank tile is', blankTile);
		//console.log('lastTile before', lastTile);
		lastTile.x = blankTile.x;
		lastTile.y = blankTile.y;
		lastTile.current = blankTile.index;
		tiles[lastTile.num - 1] = lastTile;
		//console.log('last tile after', lastTile);
		//console.log('all tiles after', tiles);
		lastTile.insertTile();
		solveTile++;
	}
	else {
		for (i = solveTile - 1; i < tiles.length; i++) {
			if (tiles[i].num != tiles[i].current) {
				solveTile = i + 1;
				break;
			}
		}
		//console.log('solveTile is ', solveTile);
		//console.log('solve tile num', solveTile);
		//console.log('tile map', tileMap);
		let tile1 = tiles[solveTile - 1];
		let t2Index = tileMap.get(tile1.num);
		//console.log('t2 curr', t2Index);
		let tile2 = tiles[t2Index - 1];
		//console.log('tile 1 before', tile1);
		//console.log(' tile2 before', tile2);
		[tile1.x, tile2.x] = [tile2.x, tile1.x];
		[tile1.y, tile2.y] = [tile2.y, tile1.y];
		[tile1.current, tile2.current] = [tile2.current, tile1.current];

		tileMap.set(tile1.current, tile1.num);
		tileMap.set(tile2.current, tile2.num);
		//	console.log(' tile 1 is: ', tile1);
		//	console.log('tile 2 is: ', tile2);
		tile1.insertTile();
		tile2.insertTile();
	}
}
function generateTiles(positions) {
	//console.log('positions passed are :', positions);
	//console.log('Generating tiles');
	let position = null;
	let tile = null;
	for (let i = 1; i < 16; i++) {
		position = getRandomFreePosition(positions);
		//console.log('position for ' + i + ' is : ', position);
		tile = new Tile(position.x, position.y, i);
		tiles.push(tile);
		tile.insertTile();
		position.free = false;
		position = null;
		tile = null;
		//console.log('generated tiles are : ', tiles);
	}
}
function addMove() {
	moves++;
	$('#score-point .num').html(moves);
}
function displayCurrentTime() {
	let minutes = Math.floor(time / 60);
	let seconds = time - minutes * 60;
	$('#timepoint .num').html(convert(minutes) + ':' + convert(seconds));
}
function convert(n) {
	return n > 9 ? "" + n : "0" + n;
}
function win() {
	pauseGame();
	$('#overlay-paused').hide();
	$('#overlay-inner').show();
	$('#overlay-inner #overlay-message').html('YOU WIN!').show();
	var finalTime = $('#timepoint .num').html();
	var finalMoves = $('#score-point .num').html();
	$('#overlay-buttons').show();
	$('#overlay-inner #overlay-submessage').html('<b>Time</b>: ' + finalTime + '&nbsp&nbsp&nbsp<b>Moves</b>: ' + finalMoves).show();
	$('#overlay-buttons #submit-button').addClass('enabled');
	$('#overlay-buttons #submit-button').css(
		'opacity', '1'
	);
	tiles = [];
	won = true;
	if (localStorage.getItem("challenge_code") != null) {
		$('#start-button').addClass('disabled');
		$('#submit-button').click();
	}
}
$(document).keydown(function (e) {
	var tile = null;
	var position = getFreePosition();
	if (!paused) {
		e.preventDefault();
		switch (e.which) {
			case 37: // left
				console.log('left');
				if (position.y < 4) {
					tile = getTileInPosition(position.x, position.y + 1);
					tile.move();
				}
				break;
			case 38: // up
				console.log('up');
				if (position.x < 4) {
					tile = getTileInPosition(position.x + 1, position.y);
					tile.move();
				}
				break;
			case 39: // right
				console.log('right');
				if (position.y > 1) {
					tile = getTileInPosition(position.x, position.y - 1);
					tile.move();
				}
				break;
			case 40: // down
				console.log('down');
				if (position.x > 1) {
					tile = getTileInPosition(position.x - 1, position.y);
					tile.move();
				}
				break;
			case 27: // esc
				console.log('esc');
				pauseGame();
				break;
			default: return;
		}
	} else {
		switch (e.which) {
			case 27: 	// esc
				console.log(won);
				if ($('#options-inner').is(":visible")) {
					$("#options-inner").slideUp("slow");
				}
				if ($('#new-challenge-box').is(":visible") || $("#challenge-details").is(":visible")) {
					$("#challenge-button").click();
				}
				if ($('#challenge-code-input').is(":visible")) {
					//				$('#challenge-code-input').hide();
					//				$('#challenge-button').fadeIn('fast');
				}
				if (paused && $('#timepoint .num').html() != '00:00' && !won) {
					startGame();
				}
				break;
			case 13: 	// enter
				console.log('enter');
				if (paused && !won && !$('#start-button').hasClass('disabled')) {
					startGame();
				}
				if (won && !$('#overlay-play').is(":visible")) {
					//resetGame();
				}
				break;

			default: return;
		}
	}
});
function loadScores() {
	$('#loader').show();
	$('#best-scores-box .scrollable').html('');
	$.ajax({
		url: "http://www.bastapuntoesclamativo.it/private/15puzzle/best-scores.php",
		method: "GET",
		dataType: "html",
		success: function (data) {
			$('#loader').hide();
			$('#best-scores-box .scrollable').html(data);
		},
		error: function (err) {
			console.log("Error: " + err);
		}
	});
}
function loadAllScores() {
	$('#loader').show();
	$('#best-scores-box .scrollable').html('');
	$.ajax({
		url: "http://www.bastapuntoesclamativo.it/private/15puzzle/all-best-scores.php",
		method: "GET",
		dataType: "html",
		success: function (data) {
			$('#loader').hide();
			$('#best-scores-box .scrollable').html(data);
		},
		error: function (err) {
			console.log("Error: " + err);
		}
	});
}
function insertScore(name) {
	name = mysql_real_escape_string(name);
	$.ajax({
		url: "http://www.bastapuntoesclamativo.it/private/15puzzle/insert-score.php?name=" + name + "&moves=" + moves + "&time=" + $('#timepoint .num').html(),
		method: "GET",
		dataType: "html",
		success: function (data) {
			if (data == 'success') {
				console.log('added score row');
				loadScores();
			}
		},
		error: function (err) {
			console.log("Error: " + err);
		}
	});

	if (localStorage.getItem("challenge_code") != null) {
		//Store challenge result
		var code = localStorage.getItem("challenge_code");
		var player_number = localStorage.getItem("player_number");
		$.ajax({
			url: "http://www.bastapuntoesclamativo.it/private/15puzzle/update-challenge.php?name=" + name + "&moves=" + moves + "&code=" + code + "&time=" + $('#timepoint .num').html() + "&player=" + player_number,
			method: "GET",
			dataType: "html",
			success: function (data) {
				if (data == 'success') {
					console.log('updated challenge ' + code + ' row');
				}
			},
			error: function (err) {
				console.log("Error: " + err);
			}
		});
	}
}
function mysql_real_escape_string(str) {
	return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
		switch (char) {
			case "\0":
				return "\\0";
			case "\x08":
				return "\\b";
			case "\x09":
				return "\\t";
			case "\x1a":
				return "\\z";
			case "\n":
				return "\\n";
			case "\r":
				return "\\r";
			case "\"":
			case "'":
			case "\\":
			case "%":
				return "\\" + char;
		}
	});
}
$(document).on('keypress', '#name-input-field', function (e) {
	if (e.keyCode == 13) {
		e.preventDefault();
		if ($('#name-input-field').val() != '') {
			insertScore($('#name-input-field').val());
			$('#overlay-layer').fadeOut('fast');
			$(this).parent().fadeOut('fast');
			$('#overlay-buttons #submit-button').removeClass('enabled');
			$('#overlay-buttons #submit-button').css('opacity', '0.5');
		}
	}
});
$(document).on('click', '#view-all-scores', function () {
	if ($(this).html() == 'View all') {
		loadAllScores();
		$(this).html('Back');
	} else {
		loadScores();
		$(this).html('View all');
	}
});
$(document).on('click', '#view-all-challenges', function () {
	if ($(this).html() == 'View all') {
		loadAllChallenges();
		$(this).html('Back');
	} else {
		loadChallenges();
		$(this).html('View all');
	}
});
$(document).on('click', '#options-img', function () {
	if (!$('#challenge-button').css('opacity') == '1') {
		$("#new-challenge-box").slideUp('slow');
		$("#challenge-details").slideUp('slow');
	}
	if (!$("#options-inner").is(":visible")) {
		$(this).css('opacity', '0.3');
	} else {
		$(this).css('opacity', '1');
	}
	$("#options-inner").slideToggle("slow");
});
$(document).on('click', '#challenge-button', function () {

	if ($("#options-inner").is(":visible")) {
		$("#options-inner").slideUp('slow');
	}
	if (localStorage.getItem("challenge_code") == null) {
		$("#new-challenge-box").slideToggle("slow");
	} else {
		loadChallengeInfo(localStorage.getItem("challenge_code"));
		$("#challenge-details").slideToggle("slow");
	}

	if ($('#challenge-arrow').attr('src') == 'img/arrow-down.png') {
		$('#challenge-arrow').attr('src', 'img/arrow-up.png');
	} else {
		$('#challenge-arrow').attr('src', 'img/arrow-down.png');
	}

});
$(document).on('click', '#help-button', function () {
	solveStep();
	console.log('help clicked');
})
function moveSwipedTile(direction) {
	var pos = getFreePosition();
	var tile = null;
	switch (direction) {
		case 'left':
			if (pos.y < 4) {
				tile = getTileInPosition(pos.x, pos.y + 1);
				tile.move();
			}
			break;
		case 'right':
			if (pos.y > 1) {
				tile = getTileInPosition(pos.x, pos.y - 1);
				tile.move();
			}
			break;
		case 'up':
			if (pos.x < 4) {
				tile = getTileInPosition(pos.x + 1, pos.y);
				tile.move();
			}
			break;
		case 'down':
			if (pos.x > 1) {
				tile = getTileInPosition(pos.x - 1, pos.y);
				tile.move();
			}
			break;
		default:
			break;
	}

}
function resizeWindowMobile() {
	$('#timepoint').insertAfter('#play-box');
	$('#score-point').insertAfter('#play-box');
}
function resizeWindowDesktop() {
	$('#info-box').prepend($('#timepoint'));
	$('#info-box').prepend($('#score-point'));
}
$(window).resize(function () {
	setTimeout(function () {
		if ($(window).width() < 630) {
			resizeWindowMobile();
		} else {
			resizeWindowDesktop();
		}
	}, 500);
});
//Challenges
$(document).on('click', '#new-challenge', function () {
	var on_challenge = localStorage.getItem("challenge_code");
	if (on_challenge == null) {
		$.ajax({
			url: "http://www.bastapuntoesclamativo.it/private/15puzzle/insert-new-challenge.php",
			method: "GET",
			dataType: "html",
			success: function (data) {
				var challenge_code = data;
				localStorage.setItem("challenge_code", challenge_code);
				localStorage.setItem("player_number", 1);
				$('#game-mode').html('CHALLENGE MODE - CODE: <b>' + challenge_code + '</b>');
				$('#new-challenge-box').slideUp("slow");
				$('#reset-button').addClass('disabled');
			},
			error: function (err) {
				console.log("Error: " + err);
			}
		});
	} else {
		alert('another challenge!');
	}
});
function showBtnErrorMessage() {
	$('#buttons-error-message').fadeIn('slow').delay(500).fadeOut('slow');
}
$(document).on('click', '#cancel-challenge', function () {
	localStorage.clear();
	$('#challenge-details').slideUp("slow");
	$('#game-mode').html('NORMAL MODE');
	$('#reset-button').removeClass('disabled');
	$('#start-button').removeClass('disabled');
});
$(document).on('click', '#refresh-icon', function () {
	loadChallengeInfo(localStorage.getItem('challenge_code'));
});
$(document).on('click', '#resume-challenge-button', function () {
	if ($('#challenge-code-input').val() != '') {
		console.log($('#challenge-code-input').val().length);
		if ($('#challenge-code-input').val().length == 4) {
			var code = $('#challenge-code-input').val();
			$.ajax({
				url: "http://www.bastapuntoesclamativo.it/private/15puzzle/check-challenge-code.php?code=" + code,
				method: "GET",
				dataType: "html",
				success: function (data) {
					if (data == 'success') {
						localStorage.setItem("challenge_code", code);
						localStorage.setItem("player_number", 2);
						$('#game-mode').html('CHALLENGE MODE - CODE: <b>' + code + '</b>');
						$('#new-challenge-box').slideUp("slow");
						$('#reset-button').addClass('disabled');
					} else {
						console.log('invalid code');
					}
				},
				error: function (err) {
					console.log("Error: " + err);
				}
			});
		} else {
			console.log('lenght invalid code');
		}
	}
});
function loadChallengeInfo(code) {
	$('#challenge-loader').show();
	$('#match-row').html('');
	$.ajax({
		url: "http://www.bastapuntoesclamativo.it/private/15puzzle/get-challenge-info.php?code=" + code,
		method: "GET",
		dataType: "html",
		success: function (data) {
			$('#match-row').html(data);
			$('#challenge-loader').hide();
			if ($('#player-1 .challenge-score').html() != '0' && $('#player-2 .challenge-score').html() != '0') {
				if (parseInt($('#player-1 .challenge-score').html()) < parseInt($('#player-2 .challenge-score').html())) {
					$('#player-1').prepend('<img src="img/medal.png" id="medal">');
				} else {
					$('#player-2').prepend('<img src="img/medal.png" id="medal">');
				}
				$('#reset-button').addClass('disabled');
				$('#start-button').addClass('disabled');

			}

		},
		error: function (err) {
			console.log("Error: " + err);
		}
	});
}
function loadChallenges() {
	$('#clg-loader').show();
	$('#last-challenges-box .scrollable').html('');
	$.ajax({
		url: "http://www.bastapuntoesclamativo.it/private/15puzzle/last-challenges.php",
		method: "GET",
		dataType: "html",
		success: function (data) {
			$('#clg-loader').hide();
			$('#last-challenges-box .scrollable').html(data);
		},
		error: function (err) {
			console.log("Error: " + err);
		}
	});
}
function loadAllChallenges() {
	$('#clg-loader').show();
	$('#last-challenges-box .scrollable').html('');
	$.ajax({
		url: "http://www.bastapuntoesclamativo.it/private/15puzzle/all-challenges.php",
		method: "GET",
		dataType: "html",
		success: function (data) {
			$('#clg-loader').hide();
			$('#last-challenges-box .scrollable').html(data);
		},
		error: function (err) {
			console.log("Error: " + err);
		}
	});
}