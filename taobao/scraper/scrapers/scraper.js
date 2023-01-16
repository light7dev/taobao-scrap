import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
const { translateText, translateDocs } = require('puppeteer-google-translate');

const opt = { from: 'ch', to: 'en', timeout: 60000, headless: true };

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const ScrapInfo = {
    ajax_url: `https://xc-mobile.world.taobao.com/category-1119505861.htm?spm=a312a.7700824.w5002-23865447062.3.25162502xAawII&search=y&catName=%C6%BD%B9%FB%CA%D6%BB%FA%C5%E4%BC%FE%D7%A8%C7%F8`,
    website: `https://xc-mobile.world.taobao.com/category-1119505861.htm?spm=a312a.7700824.w5002-23865447062.3.25162502xAawII&search=y&catName=%C6%BD%B9%FB%CA%D6%BB%FA%C5%E4%BC%FE%D7%A8%C7%F8`,
  };

const fetchSource = () => {
  return new Promise(async (resolve,reject) => {
    try {
        const entities =[];
        const browserURL = 'http://127.0.0.1:21222';
        const browser = await puppeteer.connect({browserURL});
        // const browser = await puppeteer.launch({
        //     executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        //     headless: false,
        //     // args: [
        //     //     '--auto-open-devtools-for-tabs',
        //     //     '--disable-dev-shm-usage'
        //     // ]
        // })
        const page = await browser.newPage()
        await page.setRequestInterception(true);
        // page.on('request', (request) => {
        // if (request.resourceType() === 'video'||request.resourceType() === 'image') {
        //     request.abort();
        // }
        // else {
        //     request.continue()
        // }
        // })

        await page.goto(ScrapInfo.website,{
          waitUntil: 'load'
        })
        await page.waitForSelector('.item3line1', {timeout: 10000});
        // await new Promise((rs, rj)=>{setTimeout(()=>rs(),60000)})
        var html = await page.evaluate(() => {
            return document.body.innerHTML
        })

        const $ = cheerio.load(html);

        // const data = fs.readFileSync('./scraper_ref/main.ref.txt',
        //     {encoding:'utf8', flag:'r'});
        // const $ = cheerio.load(data)
        
        var all = $('#J_HesperCats').find('a.J_SearchAsync').eq(0).attr('href').replace('//', 'https://')
        
        await page.goto(all, {
          waitUntil: 'load'
        })
        
        while(true){

          await page.waitForSelector('.item3line1', {timeout: 10000});
          html= await page.evaluate(() => {
            return document.body.innerHTML
          })
          const _$=cheerio.load(html)

          const items = _$('.shop-hesper-bd .item3line1').find('.item')
          for(var j=0;j<items.length;j++){
            const link = _$(items[j]).find('a.J_TGoldData').eq(0).attr('href').replace('//','https://');
            const item_={}
            item_.image=_$(items[j]).find('img').eq(0).attr('src').replace('//', 'https://')
            item_.link=link
            await page.goto(link,{
              waitUntil: 'load'
            })
            
            try{
              await page.waitForSelector('#J_isku .J_TSaleProp li', {timeout: 10000});
              
              html= await page.evaluate(() => {
                return document.body.innerHTML
              })
              
              const __$=cheerio.load(html);

              // const data_ = fs.readFileSync('./scraper_ref/details.ref.txt',
              //   {encoding:'utf8', flag:'r'});
              // const _$ = cheerio.load(data_)
              
              item_.title = __$('#J_Title .tb-main-title').text().replaceAll('\n','').trim()
              item_.subtitle = __$('#J_Title .tb-subtitle').text().replaceAll('\n','').trim()
              item_.default_images = []
              __$('#J_UlThumb li').each((_idx, default_image) => {
                if(__$(default_image).attr('id')===undefined)
                item_.default_images.push(__$(default_image).find('img').eq(0).attr('data-src').replace('//', 'https://'))
              });
              item_.price = {
                price: __$('#J_StrPrice').text().replaceAll('\n','').trim(),
                count: __$('#J_SellCounter').text().replaceAll('\n','').trim(),
                sales: __$('#J_SellCounter').next().text().replaceAll('\n','').trim()
              }
              item_.step_price = __$('#J_StepPrice').text().replaceAll('\n','').trim()
              var arr = __$('#J_OtherDiscount .tb-other-discount').text().split('\n').map(s=>s.trim())
              item_.discount = ''
              arr.forEach(s=>{
                item_.discount += s
              })
              item_.categories = []
              const categories = __$('#J_isku .J_TSaleProp li')
              categories.each((_idx, category) => {
                var category_image = __$(category).find('a').eq(0).css('background');
                if(category_image!==undefined)
                category_image = category_image.replace('url(','').slice(0, category_image.indexOf(')')).replace(/\"/gi, "").replace('//', 'https://');
                else
                category_image=''
                var category_title = __$(category).find('a').eq(0).text().replaceAll('\n','').trim()
                item_.categories.push({
                  title: category_title,
                  image: category_image,
                })
              });
              items.push(item_)
              
            }catch(err){
              console.log(err)
            }
            await new Promise((rs, rj)=>{setTimeout(()=>rs(), 1000)})
          }
          
          await fs.appendFileSync('./results/result.json', JSON.stringify(items, null, 2)+',\n', 'utf8', () => {
            console.log('>>>')
          });

          let next =_$('.pagination .next').eq(0).attr('href')
          if(next){
            next = next.replace('//', 'https://')
          }
          else 
            break;

          await page.goto(next, {
            waitUntil: 'load'
          })

        }
        
        // browser.close()
        resolve(entities)
        
    } catch (error) {
    reject(error)
      throw error;
    }
  });
};

const processFetch = () => {
    fetchSource()
    
};

export const scraperModule = {
  processFetch
};
