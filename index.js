// Dependencies
const puppeteer = require('puppeteer');
const $ = require('cheerio');

// Getting data which helps to login and send message
const data = require('./configuration/data.json');

// config.json contains your username, password, message to be sent and Receiver's fb ID
const config = require('./configuration/config.json');

let browser = null;
let page = null;

// login for the one time only
var login = async function (config) {

    // initialising the bot

    browser = await puppeteer.launch({
        headless: false,
        args: ['--disable-notifications', '--start-maximized'],
    });
    page = await browser.newPage();

    // opening the messenger webpage

    await page.goto(data.baseUrl + 'login/', {
        waitUntil: 'networkidle2'
    })
        .then(async () => {

            // input username
            await page.waitForSelector(data.username);
            await page.focus(data.username);
            await page.type(data.username, '');
            await page.type(data.username, config.username);
        })
        .then(async () => {

            // input password
            await page.waitForSelector(data.password);
            await page.focus(data.password);
            await page.type(data.password, '');
            await page.type(data.password, config.password);
        })
        .then(async () => {

            // logging into messenger
            await page.waitForSelector(data.loginButton);
            await page.click(data.loginButton);
        })
        .then(async () => {

            await page.waitForNavigation({ waitUntil: 'networkidle2' });

            // Checking if url visited is not null
            if (page.url() == null) {

                // could not load or login messenger, hence exiting
                await browser.close();
                process.exit();
                return;

            } else {

                // calling function to send message
                setImmediate(ping);
            }
        })
        .catch(async (err) => {
            await browser.close();
            console.log("Something Went Wrong.. Run again");
            process.exit();
            return;
        });

}

var ping = async function () {

    // Forming chat url for receiver and navigating there

    let url = data.baseUrl + 't/' + config.receiverID;

    await page.goto(url).then(function () {
        return page.content();
    })
        .then(async function (html) {

            // checking the status of receiver
            let status = $('._2v6o', html).text();

            // If user is online, sends message and then program quits automatically
            if (status == 'Active on Messenger') {

                // Typing Your Message and sending it
                await page.waitForSelector(data.messageBoxDOMSelector);
                await page.focus(data.messageBoxDOMSelector);
                await page.type(data.messageBoxDOMSelector, '');
                await page.type(data.messageBoxDOMSelector, config.message + '\n');

                // Job Done.. Exiting the process
                setTimeout(() => {
                    browser.close();
                    process.exit();
                }, 15000);

            } else {

                // running every 30 seconds
                return setTimeout(ping, 1000 * 30)

            }

        })
        .catch(function (err) {

            // If some error occurs, calling the function again
            console.log("Error :: " + err);
            return setTimeout(ping, 1000 * 30)

        })

}

login(config);