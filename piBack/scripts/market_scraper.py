import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import json
import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import logging

class MarketScraper:
    def __init__(self):
        self.setup_logging()
        self.competitors = {
            'udemy': 'https://www.udemy.com',
            'coursera': 'https://www.coursera.org',
            'edx': 'https://www.edx.org'
        }
        self.data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../data/market_insights')
        os.makedirs(self.data_dir, exist_ok=True)

    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../logs/market_scraper.log')),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def setup_selenium(self):
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        return webdriver.Chrome(options=chrome_options)

    def scrape_udemy(self, search_term):
        try:
            self.logger.info(f"Scraping Udemy for: {search_term}")
            driver = self.setup_selenium()
            search_url = f"{self.competitors['udemy']}/courses/search/?q={search_term}"
            driver.get(search_url)
            
            # Wait for course cards to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "course-card"))
            )
            
            courses = []
            course_elements = driver.find_elements(By.CLASS_NAME, "course-card")
            
            for element in course_elements[:10]:  # Get first 10 courses
                try:
                    course = {
                        'platform': 'Udemy',
                        'title': element.find_element(By.CLASS_NAME, "course-card--course-title").text,
                        'price': element.find_element(By.CLASS_NAME, "price-text--price-part").text,
                        'rating': element.find_element(By.CLASS_NAME, "star-rating--rating-number").text,
                        'students': element.find_element(By.CLASS_NAME, "enrollment").text,
                        'url': element.find_element(By.TAG_NAME, "a").get_attribute("href"),
                        'scrape_date': datetime.now().isoformat()
                    }
                    courses.append(course)
                except Exception as e:
                    self.logger.error(f"Error extracting course data: {e}")
            
            driver.quit()
            return courses
        except Exception as e:
            self.logger.error(f"Error scraping Udemy: {e}")
            return []

    def scrape_coursera(self, search_term):
        try:
            self.logger.info(f"Scraping Coursera for: {search_term}")
            url = f"{self.competitors['coursera']}/search?query={search_term}"
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            courses = []
            course_cards = soup.find_all('div', class_='card-content')
            
            for card in course_cards[:10]:  # Get first 10 courses
                try:
                    course = {
                        'platform': 'Coursera',
                        'title': card.find('h2').text.strip(),
                        'rating': card.find('span', class_='ratings-text').text if card.find('span', class_='ratings-text') else 'N/A',
                        'students': card.find('span', class_='enrollment-number').text if card.find('span', class_='enrollment-number') else 'N/A',
                        'url': f"{self.competitors['coursera']}{card.find('a')['href']}",
                        'scrape_date': datetime.now().isoformat()
                    }
                    courses.append(course)
                except Exception as e:
                    self.logger.error(f"Error extracting Coursera course data: {e}")
            
            return courses
        except Exception as e:
            self.logger.error(f"Error scraping Coursera: {e}")
            return []

    def analyze_market_data(self, courses):
        try:
            analysis = {
                'total_courses': len(courses),
                'platform_distribution': {},
                'average_price': {},
                'average_rating': {},
                'total_students': {},
                'analysis_date': datetime.now().isoformat()
            }
            
            for platform in set(course['platform'] for course in courses):
                platform_courses = [c for c in courses if c['platform'] == platform]
                analysis['platform_distribution'][platform] = len(platform_courses)
                
                # Calculate price statistics (removing currency symbols and converting to float)
                prices = [float(c['price'].replace('$', '').replace('€', '')) 
                         for c in platform_courses if 'price' in c and c['price'] != 'Free']
                if prices:
                    analysis['average_price'][platform] = sum(prices) / len(prices)
                
                # Calculate rating statistics
                ratings = [float(c['rating']) for c in platform_courses 
                         if 'rating' in c and c['rating'] != 'N/A']
                if ratings:
                    analysis['average_rating'][platform] = sum(ratings) / len(ratings)
                
                # Calculate total students (cleaning and converting to numbers)
                students = []
                for course in platform_courses:
                    if 'students' in course and course['students'] != 'N/A':
                        num = ''.join(filter(str.isdigit, course['students']))
                        if num:
                            students.append(int(num))
                if students:
                    analysis['total_students'][platform] = sum(students)
            
            return analysis
        except Exception as e:
            self.logger.error(f"Error analyzing market data: {e}")
            return None

    def save_market_data(self, search_term, courses, analysis):
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            data = {
                'search_term': search_term,
                'courses': courses,
                'analysis': analysis,
                'timestamp': timestamp
            }
            
            filename = f"market_data_{search_term.replace(' ', '_')}_{timestamp}.json"
            filepath = os.path.join(self.data_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"Market data saved to {filepath}")
            return filepath
        except Exception as e:
            self.logger.error(f"Error saving market data: {e}")
            return None

    def get_market_insights(self, search_term):
        """Main function to get market insights for a specific search term"""
        try:
            self.logger.info(f"Getting market insights for: {search_term}")
            
            # Collect courses from different platforms
            courses = []
            courses.extend(self.scrape_udemy(search_term))
            courses.extend(self.scrape_coursera(search_term))
            
            # Analyze the collected data
            analysis = self.analyze_market_data(courses)
            
            # Save the data
            filepath = self.save_market_data(search_term, courses, analysis)
            
            return {
                'success': True,
                'courses': courses,
                'analysis': analysis,
                'filepath': filepath
            }
        except Exception as e:
            self.logger.error(f"Error getting market insights: {e}")
            return {
                'success': False,
                'error': str(e)
            }

if __name__ == '__main__':
    # Test the scraper
    scraper = MarketScraper()
    results = scraper.get_market_insights("python programming")
    print(json.dumps(results, indent=2)) 