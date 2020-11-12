CREATE TABLE "music" (
	"videoId"	TEXT NOT NULL,
	"startTime"	INTEGER NOT NULL,
	"title"	TEXT NOT NULL,
	"artist"	TEXT NOT NULL,
	"category"	TEXT NOT NULL,
	"year"	TEXT NOT NULL,
	"option1"	INTEGER NOT NULL,
	"option2"	TEXT NOT NULL,
	"option3"	TEXT NOT NULL,
	"option4"	TEXT NOT NULL,
	"correct"	INTEGER NOT NULL,
	PRIMARY KEY("videoId")
);

CREATE TABLE "scores" (
	"guildId"	TEXT NOT NULL,
	"userId"	TEXT NOT NULL,
	"correct"	INTEGER NOT NULL,
	"score"	INTEGER NOT NULL
);

CREATE TABLE "stats" (
	"gamesPlayed"	INTEGER,
	"correctAnswers"	INTEGER,
	"wrongAnswers"	INTEGER,
	"songsPlayed"	INTEGER
);