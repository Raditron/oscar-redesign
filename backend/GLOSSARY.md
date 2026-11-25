# Oscar Club

The bar's changing content: what it serves, when it's open, what's on, and how to reach it. Guests read it on the
public site; the bar's staff keep it current in the admin panel. These words mean the same thing in the code, the
tests and the issues.

## Time

**ServiceNight**:
The bar's night, named by the date it opens on. A moment belongs to the ServiceNight of its own date, except a
moment after midnight and before the previous day's closing time, which still belongs to the previous date's.
_Avoid_: business day, day, night (on its own)

**WeeklySchedule**:
The bar's hours for the week: one DayHours for each of the seven weekdays.
_Avoid_: opening hours (the guests' phrase, not the model's), timetable, working hours

**DayHours**:
One weekday's hours: either closed, or an opening time and a closing time, where the closing time may be after
midnight.
_Avoid_: shift, slot

**HappyHour**:
The daily window, from one time to another, when drinks are discounted, with the discount as a percentage from 1
to 100.
_Avoid_: promo, offer, discount (on its own)

## Values

**LocalizedText**:
A piece of text in both of the site's languages, Bulgarian and English, neither of them blank.
_Avoid_: translation, i18n string, bilingual text

**Money**:
An amount in euro, counted in whole cents and never negative.
_Avoid_: price (a price is one use of Money), amount, leva

**Unconfirmed price**:
A MenuItem price the bar hasn't confirmed yet. Guests see "—" in its place, never a guess.
_Avoid_: missing price, null price, TBC, zero price

## Menu

**Section**:
One of the three parts of the menu that hold Categories: shots, sets and spirits.
_Avoid_: menu category, type, kind

**Category**:
A named group of MenuItems within one Section, in the bar's chosen order, with an optional serving size.
_Avoid_: group, list, menu section

**Serving size**:
The pour a Category's prices refer to, written the way the bar writes it in each language, e.g. "50 ml", or "0,5 l"
in Bulgarian and "0.5 l" in English.
_Avoid_: portion, volume (volume belongs to a Cocktail)

**MenuItem**:
One line of a Category: a name, an optional note, and a price that may be unconfirmed. It exists only inside its
Category.
_Avoid_: product, drink, entry

**Cocktail**:
One of the bar's signature cocktails, shown with its photo, ingredients, base spirit, volume, price and accent
colour, and, in the home page carousel, its slogan and description.
_Avoid_: drink, signature (on its own), recipe

**Volume**:
How much a Cocktail holds, in whole millilitres: 280.
_Avoid_: size, serving size (that belongs to a Category), ml (on its own)

**Image path**:
Where a Cocktail's photo is: the path to one of the site's own images, "assets/img/cocktails/taratorw.webp", never a
link to another site.
_Avoid_: image URL, photo link, src

**Base spirit**:
The spirit a Cocktail is built on, from a fixed list (vodka, whiskey, rum, tequila, gin, cognac, soju); guests
filter the cocktails by it.
_Avoid_: alcohol, type, category

**Accent colour**:
The drink colour from the site's design that a Cocktail is shown in, one of a fixed set.
_Avoid_: theme, tint

**Featured**:
Said of a Cocktail that appears in the home page carousel, with the slogan and description it carries for it.
_Avoid_: highlighted, promoted, pinned

**Slug**:
The short name a Category or a Cocktail goes by in the site's addresses, the menu's anchors and the links to them:
"irish", "tarator". No two Categories share one, and no two Cocktails.
_Avoid_: id (that is its identity, which never changes), key, handle

**Position**:
Where a Category stands among the Categories of its Section, or a Cocktail among the Cocktails: the bar's chosen
order, counted from 1.
_Avoid_: order, index, rank, sort order

**Hidden**:
Said of a MenuItem or Cocktail that stays in the admin panel but is left off the public site, e.g. while it's out
of stock.
_Avoid_: disabled, inactive, deleted, archived

## Events

**Event**:
Something on at the bar, such as a DJ, on a date in Sofia, with a title and an entry fee or free entry.
_Avoid_: gig, party, DJ night (the site's wording, not the model's)

**Upcoming**:
Said of an Event whose date is on or after the date of the current ServiceNight.
_Avoid_: future, active, current

**Entry fee**:
What a guest pays to get into an Event, as Money. An Event without one has free entry; an entry fee of 0 € is still
an entry fee, kept as the bar wrote it, and is not the same as free entry.
_Avoid_: cover, ticket price, door fee

## Venue

**VenueSettings**:
The bar's own details that the site shows: its WeeklySchedule, HappyHour and Contacts. There is exactly one.
_Avoid_: settings (on its own), config, bar info

**Contacts**:
How guests reach the bar: the reservation phone, the general email, the events email and phone, the address in both
languages with the link to its directions on Google Maps, the Instagram handle and the Facebook page.
_Avoid_: contact info, details

## People

**Guest**:
Anyone reading the public site. Guests are always anonymous.
_Avoid_: user, visitor, customer

**Admin**:
A member of the bar's staff logged in to the admin panel with the one shared password.
_Avoid_: user, editor, owner (ambiguous: the bar's owner, or the developer who owns this project)

**Session**:
What logging in gives an Admin: 8 hours in which the admin panel may change the content, carried by a token the
panel sends with every admin request. A new admin password ends every Session started before it.
_Avoid_: login (that is the act of getting a session), account
