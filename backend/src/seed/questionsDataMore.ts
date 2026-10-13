/**
 * More questions: data skills.
 * Each skill gets 5 more questions (2 easy, 1 medium, 2 hard), so the bank of every skill
 * has 15 questions: 5 easy, 5 medium, 5 hard. An assessment asks 10 of them.
 * Format: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { ExtraQuestions } from './types';

export const dataMoreQuestions: ExtraQuestions[] = [
  {
    skill: 'Excel',
    questions: [
      [0, 1, 'Which function calculates the average of a range?', 'AVERAGE', ['MEDIAN', 'MIDDLE', 'MEANSUM']],
      [1, 1, 'What does the cell reference B3 mean?', 'Column B and row 3', ['Row B and column 3', 'The third value of the sheet', 'Cell B copied three times']],
      [2, 2, 'Which chart type fits showing the parts of a whole in Excel?', 'Pie chart', ['Scatter chart', 'Line chart', 'Histogram']],
      [0, 3, 'What is an advantage of XLOOKUP over VLOOKUP?', 'It can look in any direction and needs no column index number', ['It only works with numbers', 'It can only look left', 'It is exactly the same function']],
      [1, 3, 'Why is it better to format data as an Excel Table (Ctrl+T) than as a plain range?', 'Formulas, filters and charts grow automatically when rows are added', ['Tables hide the data from other users', 'Tables are the only way to sort data', 'Tables delete empty rows by themselves']],
    ],
  },
  {
    skill: 'Python',
    questions: [
      [0, 1, 'Which function reads text typed by the user in the terminal?', 'input()', ['read()', 'scan()', 'get()']],
      [1, 1, 'How many times does the body of for i in range(5): run?', '5', ['4', '6', 'Forever']],
      [2, 2, 'How do you read the key "name" from a dictionary d without an error when it is missing?', 'd.get("name")', ['d["name"]', 'd.name', 'd.find("name")']],
      [0, 3, 'What does "3" * 2 give in Python?', 'The string "33"', ['The number 6', 'The string "6"', 'A TypeError']],
      [1, 3, 'What is the mistake in def add(item, items=[])?', 'The same list is shared by every call that does not pass items', ['The list is created empty on every call', 'Python raises a SyntaxError', 'The list becomes read-only']],
    ],
  },
  {
    skill: 'Statistics',
    questions: [
      [0, 1, 'Which measure is the middle value of an ordered data set?', 'Median', ['Mode', 'Range', 'Variance']],
      [0, 1, 'What is the mode of 2, 3, 3, 5, 7?', '3', ['2', '5', '7']],
      [1, 2, 'What is the probability of an event that is certain to happen?', '1', ['0', '0.5', '100']],
      [2, 3, 'What is a p-value?', 'The probability of results at least this extreme if the null hypothesis is true', ['The probability that the null hypothesis is true', 'The size of the effect', 'The percentage of missing data']],
      [0, 3, 'Why is the median often better than the mean for house prices?', 'A few very expensive houses pull the mean up but barely move the median', ['The median uses more data', 'The mean cannot be calculated for prices', 'The median is always higher']],
    ],
  },
  {
    skill: 'Pandas',
    questions: [
      [0, 1, 'Which attribute lists the column names of a DataFrame?', 'df.columns', ['df.names', 'df.headers', 'df.cols']],
      [1, 1, 'How do you select the column "price" of a DataFrame df?', 'df["price"]', ['df(price)', 'df.select(price)', 'df->price']],
      [2, 2, 'Which method sorts a DataFrame by the values of a column?', 'sort_values', ['sort_index', 'arrange', 'rank_by']],
      [1, 3, 'Why can df[df.a > 1]["b"] = 0 fail to change df?', 'The first selection may return a copy, so the assignment changes the copy', ['pandas forbids assignments', 'The column b does not exist', 'Boolean masks cannot be used for assignment']],
      [2, 3, 'What does pd.merge(a, b, on="id", how="left") keep?', 'All rows of a, with the matching data from b', ['Only the rows present in both', 'All rows of b only', 'Only the rows missing in b']],
    ],
  },
  {
    skill: 'Data Cleaning',
    questions: [
      [0, 1, 'What does NaN stand for in pandas?', 'Not a Number, a marker for a missing value', ['New and Normal', 'No Active Name', 'Number and Number']],
      [1, 1, 'What is a duplicate row?', 'A row with the same values as another row', ['A row with a missing value', 'A row at the bottom of the table', 'A row with long text']],
      [2, 2, 'Which chart is a common way to spot outliers visually?', 'A box plot', ['A pie chart', 'A word cloud', 'A map']],
      [0, 3, 'Why can filling every missing age with the mean distort the data?', 'It reduces the variation and can hide real patterns', ['It always increases the ages', 'It makes the ages negative', 'It deletes the other columns']],
      [1, 3, 'What does df.drop_duplicates(subset=["email"]) do?', 'Removes rows with a repeated email and keeps the first one', ['Removes every row that has an email', 'Keeps only the email column', 'Merges the duplicate emails into one list']],
    ],
  },
  {
    skill: 'Data Visualization',
    questions: [
      [1, 1, 'What is the legend of a chart?', 'A key that explains the colors or symbols', ['The title of the chart', 'The source file of the data', 'The scale of the axis']],
      [0, 1, 'Which chart type is a poor choice when there are many categories?', 'Pie chart', ['Bar chart', 'Line chart', 'Table']],
      [2, 2, 'What does a heatmap show?', 'Values as colors in a grid', ['Values as slices of a circle', 'A path between cities', 'Only exact numbers']],
      [1, 3, 'What does the data-ink ratio principle recommend?', 'Remove decoration that carries no information', ['Use as much ink as possible', 'Always add 3D effects', 'Label every number']],
      [0, 3, 'Why is a dual-axis chart often misleading?', 'The two scales can be chosen to make unrelated lines look correlated', ['Two axes make the chart load slower', 'It cannot show time', 'It hides the title']],
    ],
  },
  {
    skill: 'Dashboards',
    questions: [
      [0, 1, 'What does a trend arrow next to a KPI usually show?', 'Whether the value went up or down compared to an earlier period', ['The data source', 'The owner of the KPI', 'The chart type']],
      [2, 1, 'What is Power BI?', 'A business intelligence tool for building dashboards', ['A database engine', 'A programming language', 'A spreadsheet file format']],
      [1, 2, 'Why show the date range of the data on a dashboard?', 'Viewers need to know which period the numbers cover', ['It makes the dashboard load faster', 'It replaces the KPI', 'It is required by law']],
      [0, 3, 'What is the problem with a KPI that has no target or comparison?', 'Viewers cannot tell whether the value is good or bad', ['It cannot be displayed', 'It is always wrong', 'It slows down the refresh']],
      [2, 3, 'Why is the refresh schedule of a dashboard important?', 'Viewers must be able to trust how up to date the data is', ['It changes the colors of the charts', 'It hides old data forever', 'It adds new KPIs']],
    ],
  },
];