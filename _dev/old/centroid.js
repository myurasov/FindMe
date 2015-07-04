  function centroid  (points)
  {
    var A = 0, Cx = 0, Cy = 0;
    var Sa = 0, Sx = 0, Sy = 0;

    for (var i = 0; i < points.length - 1; i++)
    {
      Sa += (points[i][0] * points[i + 1][1] - points[i + 1][0] * points[i][1])
      Sx += (points[i][0] + points[i + 1][0]) * (points[i][0] * points[i + 1][1] - points[i + 1][0] * points[i][1]);
      Sy += (points[i][1] + points[i + 1][1]) * (points[i][0] * points[i + 1][1] - points[i + 1][0] * points[i][1]);
    }

    A = .5 * Sa;

    Cx = (1 / (6 * A)) * Sx;
    Cy = (1 / (6 * A)) * Sy;

    return [Cx,Cy];
  }