/**
 * Concepts and questions: data skills (Excel, Python, Statistics, Pandas, ...)
 * Format of each question: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { SkillQuestions } from './types';

export const dataQuestions: SkillQuestions[] = [
  {
    skill: 'Excel',
    concepts: [['Formulas & functions', 0.4], ['Data organization', 0.3], ['Pivot tables & charts', 0.3]],
    questions: [
      [0, 1, 'Which formula adds the values in cells A1 to A5?', '=SUM(A1:A5)', ['=ADD(A1,A5)', '=TOTAL(A1-A5)', '=A1+A5']],
      [1, 1, 'What does the Sort feature do?', 'Reorders rows by the values of a column', ['Deletes duplicates', 'Merges cells', 'Converts text to numbers']],
      [0, 2, 'Which function looks up a value in the first column of a range and returns a value from another column?', 'VLOOKUP', ['COUNTIF', 'CONCAT', 'ROUNDUP']],
      [2, 2, 'What is a PivotTable used for?', 'Summarizing and grouping large data without changing it', ['Writing macros', 'Encrypting a sheet', 'Importing images']],
      [0, 3, 'What does the $ in =$A$1 do?', 'Locks the reference so it does not change when the formula is copied', ['Formats the cell as currency', 'Makes the value negative', 'Marks the cell as text']],
      [1, 3, 'Which feature restricts what a user can type into a cell, for example only dates or items from a list?', 'Data Validation', ['Conditional Formatting', 'Freeze Panes', 'Goal Seek']],
    ],
  },
  {
    skill: 'Python',
    concepts: [['Syntax & data types', 0.35], ['Control flow & functions', 0.35], ['Collections & modules', 0.3]],
    questions: [
      [0, 1, 'What does print(type(3.5)) show?', '<class \'float\'>', ['<class \'int\'>', '<class \'str\'>', '<class \'double\'>']],
      [2, 1, 'Which structure stores key-value pairs?', 'dict', ['list', 'tuple', 'set']],
      [1, 2, 'What does list(range(3)) produce?', '[0, 1, 2]', ['[1, 2, 3]', '[0, 1, 2, 3]', '[3]']],
      [2, 2, 'Which statement imports only the sqrt function from the math module?', 'from math import sqrt', ['import sqrt from math', 'using math.sqrt', 'include math(sqrt)']],
      [0, 3, 'What is printed? a = [1, 2, 3]; b = a; b.append(4); print(a)', '[1, 2, 3, 4]', ['[1, 2, 3]', '[4]', 'An error']],
      [1, 3, 'What does the list comprehension [x * x for x in range(4)] return?', '[0, 1, 4, 9]', ['[1, 4, 9, 16]', '[0, 1, 2, 3]', '[0, 2, 4, 6]']],
    ],
  },
  {
    skill: 'Statistics',
    concepts: [['Descriptive statistics', 0.35], ['Probability', 0.35], ['Inference & testing', 0.3]],
    questions: [
      [0, 1, 'What is the median of 3, 7 and 9?', '7', ['6', '9', '19']],
      [0, 1, 'Which measure is most affected by outliers?', 'Mean', ['Median', 'Mode', 'Rank']],
      [1, 2, 'A fair coin is flipped twice. What is the probability of getting two heads?', '1/4', ['1/2', '1/3', '2/3']],
      [0, 2, 'What does standard deviation measure?', 'How spread out the values are around the mean', ['The most frequent value', 'The middle value', 'The total count']],
      [2, 3, 'A test gives p = 0.03 with a significance level of 0.05. What do you conclude?', 'Reject the null hypothesis', ['Accept the null hypothesis', 'The result is a mistake', 'The sample is too small']],
      [2, 3, 'What does a 95% confidence interval mean?', 'If the study were repeated many times, about 95% of such intervals would contain the true value', ['There is a 95% chance the sample mean is correct', '95% of the data lies inside the interval', 'The result is 95% certain to be significant']],
    ],
  },
  {
    skill: 'Pandas',
    concepts: [['DataFrames & Series', 0.35], ['Selecting & filtering', 0.35], ['Grouping & merging', 0.3]],
    questions: [
      [0, 1, 'Which function loads a CSV file into a DataFrame?', 'pd.read_csv()', ['pd.open_csv()', 'pd.load()', 'pd.csv_read()']],
      [0, 1, 'Which method shows the first rows of a DataFrame?', 'df.head()', ['df.first()', 'df.top()', 'df.start()']],
      [1, 2, 'Which expression selects rows where the age column is greater than 30?', 'df[df["age"] > 30]', ['df.where(age > 30)', 'df.filter("age > 30")', 'df.select(age > 30)']],
      [2, 2, 'What does df.groupby("city")["sales"].sum() return?', 'Total sales for each city', ['Total sales across all cities as one number', 'The list of cities', 'Sales sorted by city name']],
      [2, 3, 'Which function combines two DataFrames on a shared key column, like a SQL join?', 'pd.merge()', ['pd.append()', 'df.stack()', 'df.melt()']],
      [1, 3, 'What is the difference between df.loc and df.iloc?', 'loc selects by label; iloc selects by integer position', ['loc is for rows and iloc is for columns', 'loc modifies data and iloc only reads', 'They are identical']],
    ],
  },
  {
    skill: 'Data Cleaning',
    concepts: [['Missing values', 0.35], ['Duplicates & types', 0.35], ['Outliers & validation', 0.3]],
    questions: [
      [0, 1, 'Which pandas method detects missing values?', 'isna()', ['missing()', 'empty()', 'blank()']],
      [1, 1, 'Which method removes duplicate rows?', 'drop_duplicates()', ['remove_rows()', 'delete_same()', 'unique_rows()']],
      [0, 2, 'Which is a common way to handle missing numeric values without losing rows?', 'Fill them with the mean or median', ['Delete the whole column always', 'Replace them with the text "missing"', 'Ignore them']],
      [1, 2, 'A "price" column was read as text like "$1,200". What should you do before calculating?', 'Strip the symbols and convert it to a numeric type', ['Sum the text values directly', 'Delete the column', 'Sort it alphabetically']],
      [2, 3, 'Which rule marks a value as an outlier using the IQR method?', 'Below Q1 - 1.5 x IQR or above Q3 + 1.5 x IQR', ['Any value above the mean', 'Any value that appears twice', 'Any value above 100']],
      [2, 3, 'Why is it risky to delete outliers automatically?', 'They may be real, important cases rather than errors', ['Outliers do not exist in real data', 'Deleting rows makes files larger', 'It always improves a model']],
    ],
  },
  {
    skill: 'Data Visualization',
    concepts: [['Choosing charts', 0.4], ['Design & clarity', 0.35], ['Tools & libraries', 0.25]],
    questions: [
      [0, 1, 'Which chart is best for showing a trend over time?', 'Line chart', ['Pie chart', 'Radar chart', 'Treemap']],
      [0, 1, 'Which chart is best for comparing values across a few categories?', 'Bar chart', ['Heat map', 'Gauge', 'Sankey diagram']],
      [1, 2, 'Why should a bar chart axis normally start at zero?', 'Otherwise the bar lengths exaggerate the differences', ['It makes the chart colorful', 'Libraries require it', 'It reduces the file size']],
      [2, 2, 'Which Python library is the standard base for plotting (Seaborn is built on it)?', 'Matplotlib', ['NumPy', 'Requests', 'Flask']],
      [0, 3, 'Which chart shows the relationship between two numeric variables?', 'Scatter plot', ['Pie chart', 'Bar chart', 'Stacked area chart']],
      [1, 3, 'What is a problem with using many bright colors in a single chart?', 'It distracts the viewer and hides the main message', ['Colors slow down the chart', 'Colors are not allowed in reports', 'It changes the data values']],
    ],
  },
  {
    skill: 'Dashboards',
    concepts: [['KPIs & metrics', 0.35], ['Layout & audience', 0.35], ['Interactivity & tools', 0.3]],
    questions: [
      [0, 1, 'What does KPI stand for?', 'Key Performance Indicator', ['Key Process Index', 'Knowledge Product Inventory', 'Kernel Performance Input']],
      [2, 1, 'Which of these is a dashboard and BI tool?', 'Power BI', ['Photoshop', 'Notepad', 'Git']],
      [1, 2, 'Where should the most important metrics be placed on a dashboard?', 'At the top-left, where people look first', ['Hidden in a tooltip', 'At the bottom, after all charts', 'In a separate file']],
      [2, 2, 'What does a filter or slicer let the viewer do?', 'Narrow the data shown, for example by date or region', ['Change the source database', 'Edit the raw data', 'Export the code']],
      [0, 3, 'Which is a good KPI for a product team?', 'Monthly active users compared with last month', ['Total number of charts', 'The color of the logo', 'Number of pages in the report']],
      [1, 3, 'What should drive the design of a dashboard?', 'The questions and decisions of its audience', ['The number of available chart types', 'The designer\'s favorite colors', 'The size of the dataset']],
    ],
  },
];