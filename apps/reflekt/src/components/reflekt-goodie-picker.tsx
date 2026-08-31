import styled from "@emotion/styled";
import { MenuItem, TextField, Typography } from "@mui/material";
import {
  FullGoodieFragment,
  FullImageGalleryBlockFragment,
} from "@wepublish/website/api";
import { BuilderGoodiePickerProps } from "@wepublish/website/builder";
import { createContext, forwardRef, memo, use, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ReflektImageSliderSlim } from "./reflekt-image-slider";

export const AllGoodiesContext = createContext([] as FullGoodieFragment[]);

const GoodieSelect = styled(TextField)`
  .MuiOutlinedInput-root {
    border-radius: 0;
  }

  .MuiOutlinedInput-notchedOutline,
  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline,
  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme }) => theme.palette.common.black};
  }
`;

const webkitOnly = "@supports (background: -webkit-canvas(squares))";

const GoodieSliderArea = styled("div")`
  grid-area: goodieSlider;

  ${({ theme }) => theme.breakpoints.down("md")} {
    width: 100vw;
    margin-left: calc(50% - 50vw);

    ${webkitOnly} {
      position: relative;
      left: 50%;
      margin-left: -50vw;
    }
  }
`;

const GoodieSliderTitle = styled(Typography)`
  font-size: 1.5rem;
  margin-bottom: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.down("md")} {
    padding: 0 32px;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
` as typeof Typography;

const GoodieSelectArea = styled("div")`
  grid-area: goodie;
`;

/**
 * Kept separate and memoized: the slider only depends on the (stable) list of
 * all goodies, while the picker itself re-renders on every subscribe form
 * change. Without this the whole slider — and every image in it — is
 * reconciled again on each keystroke and member plan switch.
 */
const GoodieSlider = memo(function GoodieSlider({
  goodies,
}: {
  goodies: FullGoodieFragment[];
}) {
  const images = useMemo(() => {
    const goodieImages = goodies
      .filter((goodie) => goodie.image)
      .map((goodie) => ({
        caption: null,
        image: goodie.image,
      })) as FullImageGalleryBlockFragment["images"];

    const repeatCount = goodieImages.length
      ? Math.ceil(4 / goodieImages.length)
      : 0;

    return Array.from({ length: repeatCount }).flatMap(() => goodieImages);
  }, [goodies]);

  if (!images.length) {
    return null;
  }

  return (
    <GoodieSliderArea>
      <GoodieSliderTitle variant="h2" component="h2">
        <a id="#Crowdfunding-Geschenk">Crowdfunding-Geschenk</a>
      </GoodieSliderTitle>

      <ReflektImageSliderSlim images={images} />
    </GoodieSliderArea>
  );
});

export const ReflektGoodiePicker = forwardRef<
  HTMLInputElement,
  BuilderGoodiePickerProps
>(function ReflektGoodiePicker(
  { goodies, className, name, value, disabled, onChange },
  ref,
) {
  const { t } = useTranslation();
  const allGoodies = use(AllGoodiesContext) ?? goodies;

  return (
    <>
      <GoodieSlider goodies={allGoodies} />

      <GoodieSelectArea>
        <GoodieSelect
          select
          fullWidth
          inputRef={ref}
          className={className}
          name={name}
          value={value ?? ""}
          disabled={disabled}
          label={
            disabled ? t("subscribe.goodie.none") : t("subscribe.goodie.title")
          }
          onChange={(event) => onChange(event.target.value || null)}
        >
          <MenuItem value="">{t("subscribe.goodie.none")}</MenuItem>

          {goodies.map((goodie) => (
            <MenuItem key={goodie.id} value={goodie.id}>
              {goodie.name}
            </MenuItem>
          ))}
        </GoodieSelect>
      </GoodieSelectArea>
    </>
  );
});
