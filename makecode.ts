// micro:bit v2 — MakeCode JavaScript
// BLE UART receiver with:
// - EMO:happy commands (UNCHANGED)
// - Emotion detection in normal sentences (EN + FR, no accents)
// - Direction detection in normal sentences (EN + FR, no accents)
// - Fun extra commands (banana / dance / boom)
// - ACK replies preserved: "OK " + original line

bluetooth.startUartService()

serial.redirectToUSB()
serial.writeLine("micro:bit ready")
basic.showIcon(IconNames.Heart)

// =====================================================
// EMOTION IMAGES (original + new)
// =====================================================
const EMO_NEUTRAL = images.createImage(`
. . . . .
. . . . .
. # . # .
. . . . .
. # # # .
`)
const EMO_HAPPY = images.createImage(`
. . . . .
. # . # .
. . . . .
# . . . #
. # # # .
`)
const EMO_SAD = images.createImage(`
. . . . .
. # . # .
. . . . .
. # # # .
# . . . #
`)
const EMO_ANGRY = images.createImage(`
# . . . #
. # . # .
. . . . .
. # # # .
# . . . #
`)
const EMO_SURPRISED = images.createImage(`
. # # # .
# . . . #
# . # . #
# . . . #
. # # # .
`)
const EMO_SLEEPY = images.createImage(`
. . . . .
# . . . #
. # . # .
. . # . .
# # # # #
`)

// NEW: silly (tongue)
const EMO_SILLY = images.createImage(`
. # . # .
. # . # .
. . . . .
. # # # .
. . # . .
`)

// NEW: scared
const EMO_SCARED = images.createImage(`
# . . . #
. # . # .
. . # . .
. # # # .
# . . . #
`)

// NEW: laugh
const EMO_LAUGH = images.createImage(`
. . . . .
# . . . #
. . . . .
# # # # #
. # # # .
`)

// NEW: party
const EMO_PARTY = images.createImage(`
. # . # .
# # # # #
. # # # .
# # # # #
. # . # .
`)

// NEW: robot (square)
const EMO_ROBOT = images.createImage(`
# # # # #
# . # . #
# # # # #
# . . . #
# # # # #
`)

function showEmotion(e: string) {
    if (e == "happy") EMO_HAPPY.showImage(0)
    else if (e == "sad") EMO_SAD.showImage(0)
    else if (e == "angry") EMO_ANGRY.showImage(0)
    else if (e == "surprised") EMO_SURPRISED.showImage(0)
    else if (e == "sleepy") EMO_SLEEPY.showImage(0)

    // new ones (kid-fun)
    else if (e == "silly") EMO_SILLY.showImage(0)
    else if (e == "scared") EMO_SCARED.showImage(0)
    else if (e == "laugh") EMO_LAUGH.showImage(0)
    else if (e == "party") EMO_PARTY.showImage(0)
    else if (e == "robot") EMO_ROBOT.showImage(0)

    else EMO_NEUTRAL.showImage(0)
}

// =====================================================
// DIRECTION IMAGES
// =====================================================
const UP = images.arrowImage(ArrowNames.North)
const DOWN = images.arrowImage(ArrowNames.South)
const LEFT = images.arrowImage(ArrowNames.West)
const RIGHT = images.arrowImage(ArrowNames.East)

function showDirection(d: string) {
    if (d == "up") UP.showImage(0)
    else if (d == "down") DOWN.showImage(0)
    else if (d == "left") LEFT.showImage(0)
    else if (d == "right") RIGHT.showImage(0)
    else if (d == "stop") basic.showIcon(IconNames.No)
    else if (d == "spin") {
        for (let i = 0; i < 2; i++) {
            basic.showArrow(ArrowNames.North); basic.pause(110)
            basic.showArrow(ArrowNames.East);  basic.pause(110)
            basic.showArrow(ArrowNames.South); basic.pause(110)
            basic.showArrow(ArrowNames.West);  basic.pause(110)
        }
        basic.clearScreen()
    }
}

// =====================================================
// SAFE TEXT NORMALIZATION (NO ACCENTS, NO PUNCT STRINGS)
// (unchanged)
// =====================================================
function normalizeText(s: string): string {
    let t = s.toLowerCase()
    let out = ""

    for (let i = 0; i < t.length; i++) {
        let c = t.charCodeAt(i)

        // space
        if (c == 32) { out += " "; continue }

        // a-z
        if (c >= 97 && c <= 122) { out += t.charAt(i); continue }

        // digits
        if (c >= 48 && c <= 57) { out += t.charAt(i); continue }

        // everything else → space
        out += " "
    }

    while (out.indexOf("  ") >= 0) out = out.split("  ").join(" ")
    return out.trim()
}

function hasWord(t: string, w: string): boolean {
    return (" " + t + " ").indexOf(" " + w + " ") >= 0
}

// =====================================================
// EMOTION DETECTION (EN + FR without accents)
// (original + new keywords)
// =====================================================
function detectEmotion(line: string): string {
    let t = normalizeText(line)

    // original set
    if (hasWord(t, "happy") || hasWord(t, "joy") || hasWord(t, "content") || hasWord(t, "heureux")) return "happy"
    if (hasWord(t, "sad") || hasWord(t, "triste")) return "sad"
    if (hasWord(t, "angry") || hasWord(t, "mad") || hasWord(t, "colere")) return "angry"
    if (hasWord(t, "surprised") || hasWord(t, "surpris")) return "surprised"
    if (hasWord(t, "sleepy") || hasWord(t, "tired") || hasWord(t, "fatigue")) return "sleepy"

    // new fun emotions
    if (hasWord(t, "silly") || hasWord(t, "funny") || hasWord(t, "rigolo") || hasWord(t, "bete")) return "silly"
    if (hasWord(t, "scared") || hasWord(t, "afraid") || hasWord(t, "peur")) return "scared"
    if (hasWord(t, "laugh") || hasWord(t, "haha") || hasWord(t, "lol") || hasWord(t, "rire")) return "laugh"
    if (hasWord(t, "party") || hasWord(t, "fiesta") || hasWord(t, "fete")) return "party"
    if (hasWord(t, "robot") || hasWord(t, "mecanique")) return "robot"

    return ""
}

// =====================================================
// DIRECTION DETECTION (EN + FR without accents)
// (original + stop/spin + forward/back synonyms)
// =====================================================
function detectDirection(line: string): string {
    let t = normalizeText(line)

    // up / forward
    if (hasWord(t, "up") || hasWord(t, "haut") || hasWord(t, "monte")
        || hasWord(t, "forward") || hasWord(t, "avance") || hasWord(t, "avancer")) return "up"

    // down / back
    if (hasWord(t, "down") || hasWord(t, "bas") || hasWord(t, "descend")
        || hasWord(t, "back") || hasWord(t, "recule") || hasWord(t, "reculer")) return "down"

    if (hasWord(t, "left") || hasWord(t, "gauche")) return "left"
    if (hasWord(t, "right") || hasWord(t, "droite")) return "right"

    if (hasWord(t, "stop") || hasWord(t, "arrete") || hasWord(t, "arret")) return "stop"
    if (hasWord(t, "spin") || hasWord(t, "tourne") || hasWord(t, "tourner")) return "spin"

    return ""
}

// =====================================================
// FUN WORD TRIGGERS (does NOT change ACK behavior)
// =====================================================
function funEffects(line: string) {
    let t = normalizeText(line)

    if (hasWord(t, "banana")) {
        showEmotion("silly")
        music.playTone(659, music.beat(BeatFraction.Eighth))
        music.playTone(784, music.beat(BeatFraction.Eighth))
    }

    if (hasWord(t, "boom")) {
        basic.showIcon(IconNames.Chessboard)
        music.playTone(262, music.beat(BeatFraction.Eighth))
        music.playTone(131, music.beat(BeatFraction.Quarter))
        basic.clearScreen()
    }

    if (hasWord(t, "dance") || hasWord(t, "danse")) {
        showEmotion("party")
        for (let i = 0; i < 2; i++) {
            basic.showIcon(IconNames.Heart); basic.pause(120)
            basic.showIcon(IconNames.SmallHeart); basic.pause(120)
        }
        basic.clearScreen()
    }
}

// =====================================================
// MAIN HANDLER (ACK preserved exactly)
// =====================================================
function handleLine(line: string) {
    line = line.trim()
    if (line.length == 0) return

    serial.writeLine("RX: " + line)

    // EMO: command (UNCHANGED)
    if (line.indexOf("EMO:") == 0) {
        // keep your exact protocol, but trim spaces after EMO:
        let emo = line.substr(4).trim()
        showEmotion(emo)
        bluetooth.uartWriteLine("OK " + line)
        return
    }

    // Direction from sentence
    let d = detectDirection(line)
    if (d.length > 0) {
        showDirection(d)
        bluetooth.uartWriteLine("OK " + line)
        return
    }

    // Emotion from sentence
    let e = detectEmotion(line)
    if (e.length > 0) showEmotion(e)

    // Fun triggers (bonus)
    funEffects(line)

    // Always ACK original line
    bluetooth.uartWriteLine("OK " + line)
}

// =====================================================
// BLE UART
// =====================================================
bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    handleLine(bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine)))
})

// Debug buttons (unchanged)
input.onButtonPressed(Button.A, function () {
    basic.showIcon(IconNames.Yes)
    basic.pause(200)
    basic.clearScreen()
})
input.onButtonPressed(Button.B, function () {
    basic.showIcon(IconNames.SmallDiamond)
    basic.pause(200)
    basic.clearScreen()
})

