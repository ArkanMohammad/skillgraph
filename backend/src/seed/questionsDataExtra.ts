/**
 * Extra questions: data skills.
 * Each skill gets 4 more questions (1 easy, 2 medium, 1 hard) on top of its 6 base questions,
 * so the bank of every skill has 10 questions: 3 easy, 4 medium, 3 hard.
 * Format: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { ExtraQuestions } from './types';

export const dataExtraQuestions: ExtraQuestions[] = [
  {
    skill: 'Excel',
    questions: [
      [0, 1, 'Which symbol must every Excel formula start with?', '=', ['#', '@', '$']],
      [1, 2, 'What does Filter do on a data table?', 'Shows only the rows that match the chosen criteria', ['Deletes the rows that do not match', 'Sorts the rows alphabetically', 'Merges all rows into one']],
      [0, 2, 'What does =IF(A1>10,"High","Low") return when A1 is 5?', 'Low', ['High', '5', 'An error']],
      [2, 3, 'What should you do after changing the source data of a PivotTable?', 'Refresh the PivotTable so it shows the new values', ['Nothing, it always updates by itself', 'Rebuild the whole workbook', 'Delete the source data']],
    ],
  },
  {
    skill: 'Python',
    questions: [
      [0, 1, 'Which symbol starts a comment in Python?', '#', ['//', '--', '/*']],
      [1, 2, 'What does def greet(name="friend"): mean?', 'name has the default value "friend" when no argument is given', ['The function requires the string friend', 'name is always friend', 'It defines a class']],
      [2, 2, 'Which data structure keeps unique values only?', 'set', ['list', 'tuple', 'str']],
      [1, 3, 'What does a function return when it has no return statement?', 'None', ['0', 'An empty string', 'It raises an error']],
    ],
  },
  {
    skill: 'Statistics',
    questions: [
      [0, 1, 'What is the mean of 2, 4 and 6?', '4', ['3', '6', '12']],
      [1, 2, 'What is the probability of rolling a 6 on a fair six-sided die?', '1/6', ['1/3', '1/2', '6']],
      [0, 2, 'What does a positive correlation mean?', 'When one variable increases, the other tends to increase', ['One variable causes the other', 'The variables are unrelated', 'All values are positive']],
      [2, 3, 'What is a Type I error?', 'Rejecting a null hypothesis that is actually true', ['Failing to reject a false null hypothesis', 'Collecting too little data', 'Choosing the wrong chart']],
    ],
  },
  {
    skill: 'Pandas',
    questions: [
      [0, 1, 'What is a Series in pandas?', 'A one-dimensional labeled array, like one column', ['A table with many columns', 'A chart type', 'A saved file']],
      [1, 2, 'Which method gives count, mean and standard deviation for numeric columns?', 'df.describe()', ['df.summary_all()', 'df.stats()', 'df.info_numbers()']],
      [0, 2, 'Which attribute returns the number of rows and columns?', 'df.shape', ['df.size_of()', 'df.length', 'df.dims']],
      [2, 3, 'What does df.fillna(0) do?', 'Replaces missing values with 0 and returns a new DataFrame', ['Deletes rows with missing values', 'Counts the missing values', 'Changes every 0 to NaN']],
    ],
  },
  {
    skill: 'Data Cleaning',
    questions: [
      [1, 1, 'Which pandas method changes a column to another type, such as int?', 'astype()', ['convert_to()', 'cast_column()', 'retype()']],
      [0, 2, 'What does df.dropna() do by default?', 'Removes rows that contain missing values', ['Fills missing values with zero', 'Removes duplicate rows', 'Removes all columns']],
      [2, 2, 'What is data validation?', 'Checking that values follow rules, such as an age between 0 and 120', ['Making the data bigger', 'Encrypting the data', 'Sorting the data']],
      [1, 3, 'Why can the strings "Cairo" and "cairo " cause wrong grouping results?', 'They are different values unless case and spaces are standardized', ['Pandas merges them automatically', 'Strings cannot be grouped', 'They are always treated as numbers']],
    ],
  },
  {
    skill: 'Data Visualization',
    questions: [
      [0, 1, 'Which chart shows how a whole is divided into a few parts?', 'Pie chart', ['Line chart', 'Scatter plot', 'Histogram']],
      [0, 2, 'Which chart shows the distribution of one numeric variable?', 'Histogram', ['Pie chart', 'Radar chart', 'Treemap']],
      [1, 2, 'Why should every chart have a clear title and labeled axes?', 'So the viewer understands what is shown without guessing', ['To make the chart larger', 'To hide the data source', 'To save file size']],
      [2, 3, 'Which Python library is built on Matplotlib and makes statistical charts easier?', 'Seaborn', ['NumPy', 'Flask', 'Requests']],
    ],
  },
  {
    skill: 'Dashboards',
    questions: [
      [0, 1, 'What is a metric target?', 'A goal value that a KPI is compared with', ['A color theme', 'A chart type', 'A database table']],
      [1, 2, 'Why limit the number of charts on one dashboard screen?', 'Too many charts overload the viewer and hide the key message', ['Charts are expensive', 'Browsers cannot show more than three', 'It makes the data wrong']],
      [2, 2, 'What does drill-down let a viewer do?', 'Click a summary value to see the more detailed data behind it', ['Delete the chart', 'Change the dashboard language', 'Download the database']],
      [0, 3, 'Which is a vanity metric rather than a useful KPI?', 'Total page views with no link to a goal', ['Conversion rate', 'Customer churn rate', 'Average order value']],
    ],
  },
];